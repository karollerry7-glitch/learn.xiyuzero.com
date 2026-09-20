// 服务端 API 集成测试（node tests/api.test.mjs）
// 启动本地 next dev（MEMBERSHIP_DEV_MOCK=1），用自签 token 走全链路：
//   鉴权 / 会员默认 Free / 额度服务端计算 / Pro 升级 / 过期降级 /
//   两用户数据隔离 / 进度 LWW / 异常输入 / orders 501 占位
// 测试写入的 Blob key 一律 test-e2e- 前缀，结束即清理。

import { test } from "node:test";
import * as assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn, execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 3211;
const BASE = `http://127.0.0.1:${PORT}`;

// ---- token 签发（与 lib/auth.ts 同构；本地无 AUTH_SECRET → 同一回退密钥）----
const SECRET = "dev-only-insecure-secret-change-me";
function b64url(s) {
  return Buffer.from(s).toString("base64url");
}
function signToken(sub, ttlMs = 60 * 60 * 1000) {
  const body = b64url(JSON.stringify({ sub, exp: Math.floor((Date.now() + ttlMs) / 1000) }));
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

const USER_A = `test-e2e-a-${Date.now()}`;
const USER_B = `test-e2e-b-${Date.now()}`;
const tokA = signToken(USER_A);
const tokB = signToken(USER_B);

// ---- 启动 dev server ----
const server = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  cwd: process.cwd(),
  env: { ...process.env, MEMBERSHIP_DEV_MOCK: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

process.on("exit", () => {
  server.kill("SIGKILL");
});

async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/api/units?pageSize=1`);
      if (r.ok) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error("dev server 未就绪:\n" + serverLog.slice(-2000));
}

async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

const todayUTC = new Date().toISOString().slice(0, 10);

test("服务端 API 集成（全链路）", { timeout: 180000 }, async (t) => {
  await waitReady();

  await t.test("鉴权：无 token 访问会员/进度 → 401", async () => {
    assert.equal((await api("/api/membership")).status, 401);
    assert.equal((await api("/api/progress")).status, 401);
    assert.equal((await api("/api/orders", { method: "POST", body: {} })).status, 401);
  });

  await t.test("新用户首次进入：默认 Free，额度 5，等级 Starter+A1", async () => {
    const r = await api("/api/membership", { token: tokA });
    assert.equal(r.status, 200);
    const v = await r.json();
    assert.equal(v.plan, "free");
    assert.equal(v.isPro, false);
    assert.equal(v.entitlements.dailyNewLimit, 5);
    assert.deepEqual(v.entitlements.levels, ["Starter", "A1"]);
    assert.equal(v.usage.newLearnedToday, 0);
    assert.equal(v.usage.date, todayUTC);
  });

  await t.test("学习进度保存：POST progress 含今日 activity", async () => {
    const r = await api("/api/progress", {
      method: "POST",
      token: tokA,
      body: {
        updatedAt: Date.now(),
        reviews: { "a1-001": { status: "learning" } },
        activity: { [todayUTC]: { newLearned: 3, reviewed: 1 } },
      },
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).accepted, true);
  });

  await t.test("额度服务端计算：用量来自云端 activity（UTC 日期规则）", async () => {
    const v = await (await api("/api/membership", { token: tokA })).json();
    assert.equal(v.usage.newLearnedToday, 3);
  });

  await t.test("不同用户数据隔离：B 看不到 A 的进度与用量", async () => {
    // B 自己写一份不同的进度
    const r = await api("/api/progress", {
      method: "POST",
      token: tokB,
      body: {
        updatedAt: Date.now(),
        reviews: { "b1-001": { status: "review" } },
        activity: { [todayUTC]: { newLearned: 1 } },
      },
    });
    assert.equal((await r.json()).accepted, true);

    const vb = await (await api("/api/membership", { token: tokB })).json();
    assert.equal(vb.usage.newLearnedToday, 1); // 是 B 自己的 1，不是 A 的 3

    const pb = await (await api("/api/progress", { token: tokB })).json();
    assert.ok(pb.reviews["b1-001"]);
    assert.equal(pb.reviews["a1-001"], undefined); // A 的 reviews 不泄漏给 B

    const pa = await (await api("/api/progress", { token: tokA })).json();
    assert.ok(pa.reviews["a1-001"]);
    assert.equal(pa.reviews["b1-001"], undefined);
  });

  await t.test("云端恢复：GET progress 返回服务端保存的全量状态", async () => {
    const pa = await (await api("/api/progress", { token: tokA })).json();
    assert.equal(pa.activity[todayUTC].newLearned, 3);
    assert.equal(pa.reviews["a1-001"].status, "learning");
  });

  await t.test("LWW 冲突：旧 updatedAt 提交被拒绝", async () => {
    const r = await api("/api/progress", {
      method: "POST",
      token: tokA,
      body: {
        updatedAt: 1000, // 远旧于服务端
        reviews: {},
        activity: {},
      },
    });
    const v = await r.json();
    assert.equal(v.accepted, false);
  });

  await t.test("Pro 权限模拟：dev-plan 升级 → 不限额度全词库", async () => {
    const up = await api("/api/membership/dev-plan", {
      method: "POST",
      token: tokA,
      body: {
        plan: "pro",
        billingCycle: "yearly",
        proUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
      },
    });
    assert.equal(up.status, 200);

    const v = await (await api("/api/membership", { token: tokA })).json();
    assert.equal(v.isPro, true);
    assert.equal(v.entitlements.dailyNewLimit, null);
    assert.equal(v.entitlements.levels, null);
    assert.equal(v.entitlements.fullVocabulary, true);
  });

  await t.test("会员过期降级：proUntil 已过 → isPro=false 回 Free", async () => {
    await api("/api/membership/dev-plan", {
      method: "POST",
      token: tokA,
      body: {
        plan: "pro",
        billingCycle: "monthly",
        proUntil: new Date(Date.now() - 86400000).toISOString(), // 昨天
      },
    });
    const v = await (await api("/api/membership", { token: tokA })).json();
    assert.equal(v.plan, "pro"); // 记录还是 pro
    assert.equal(v.isPro, false); // 但已过期降级
    assert.equal(v.entitlements.dailyNewLimit, 5);
  });

  await t.test("orders 占位：登录后购买 → 501 PAYMENT_NOT_AVAILABLE", async () => {
    const r = await api("/api/orders", { method: "POST", token: tokA, body: { plan: "yearly" } });
    assert.equal(r.status, 501);
    assert.equal((await r.json()).code, "PAYMENT_NOT_AVAILABLE");
  });

  await t.test("异常输入：进度请求体非法 → 400", async () => {
    const r1 = await api("/api/progress", {
      method: "POST",
      token: tokA,
      body: { foo: "bar" },
    });
    assert.equal(r1.status, 400);

    // content-type json 但 body 不是 JSON
    const r2 = await fetch(`${BASE}/api/progress`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${tokA}` },
      body: "not-json",
    });
    assert.equal(r2.status, 400);
  });

  await t.test("异常输入：units 参数校验", async () => {
    assert.equal((await api("/api/units?level=XX")).status, 400);
    assert.equal((await api("/api/units?ids=")).status, 400);
    assert.equal((await api("/api/units?ids=" + "a1-001,".repeat(60))).status, 400);
    const ok = await api("/api/units?level=A1&page=1&pageSize=10");
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).total, 458);
  });

  await t.test("dev-plan 安全门：无 MEMBERSHIP_DEV_MOCK 的请求被拒绝（代码审查 + 本地已置 1 验证路径）", async () => {
    // 本进程启动时 env=1，验证正常可用（上面已用）；生产环境未设置 → 路由 404。
    // 这里验证 401 优先于 mock：无 token 时即使 env 开着也拒绝
    const r = await api("/api/membership/dev-plan", { method: "POST", body: { plan: "pro" } });
    assert.equal(r.status, 401);
  });

  // ---- 清理测试数据（真实 Blob 中的 test-e2e- 前缀 key）----
  await t.test("清理测试 Blob 数据", async () => {
    // 测试进程本身不读 .env.local（那是 Next.js 的加载范围）→ 手动注入 token
    const fs = await import("node:fs");
    const env = fs.readFileSync(".env.local", "utf8");
    const m = env.match(/^BLOB_READ_WRITE_TOKEN="?([^"\n]+)"?/m);
    assert.ok(m, ".env.local 缺少 BLOB_READ_WRITE_TOKEN");
    process.env.BLOB_READ_WRITE_TOKEN = m[1];
    const { del } = await import("@vercel/blob");
    await del([
      `membership/${USER_A}`,
      `progress/${USER_A}`,
      `membership/${USER_B}`,
      `progress/${USER_B}`,
    ]);
  });

  server.kill("SIGTERM");
});
