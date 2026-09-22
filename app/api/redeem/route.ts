// POST /api/redeem — 兑换码激活 Pro（终身）
//
// 售卖模式（第一版）：客服微信收款（¥99.9）→ 运营发放兑换码 → 用户在会员页输入激活。
// 安全设计：
//   1. 代码库只存兑换码的 SHA-256 哈希（明文仅在运营手里）；
//   2. 每码只能激活 1 个账号（Vercel Blob redeemed/{hash} 记账，先占位后授予）；
//   3. 同一用户重复提交同一码 = 幂等成功（不重复叠加）；
//   4. 输入归一化：去空格、转大写、无连字符的 16 位裸码自动补格式。
//
// 响应：200 { plan, billingCycle: "lifetime", proUntil, ... } 激活成功（含幂等）
//       400 格式错误 / 401 未登录 / 404 兑换码无效 / 409 已被其他账号使用

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { get, put } from "@vercel/blob";
import { authUserId } from "@/lib/auth";
import {
  grantPro,
  readMembership,
  writeMembership,
  defaultRecord,
} from "@/lib/membership";
import { REDEEM_KEY_HASHES } from "@/lib/redeem-keys";

export const runtime = "nodejs";

/** 输入归一化：允许小写/无连字符/含空格的变体（XZ-XXXX-XXXX-XXXX，去杠后 14 位） */
export function normalizeCode(raw: string): string | null {
  let s = raw.toUpperCase().replace(/\s+/g, "");
  if (/^[A-Z0-9]{14}$/.test(s)) {
    s = `${s.slice(0, 2)}-${s.slice(2, 6)}-${s.slice(6, 10)}-${s.slice(10, 14)}`;
  }
  if (!/^[A-Z0-9]{2}(-[A-Z0-9]{4}){3}$/.test(s)) return null;
  return s;
}

function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

interface RedeemRecord {
  userId: string;
  redeemedAt: number;
}

async function readRedeemed(hash: string): Promise<RedeemRecord | null> {
  try {
    const res = await get(`redeemed/${hash}`, {
      access: "private",
      useCache: false,
    });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return (await new Response(res.stream).json()) as RedeemRecord;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const userId = authUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "未登录或令牌无效" }, { status: 401 });
  }

  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const raw = typeof body.code === "string" ? body.code.trim() : "";
  if (!raw) {
    return NextResponse.json({ error: "请输入兑换码" }, { status: 400 });
  }

  const code = normalizeCode(raw);
  if (!code) {
    return NextResponse.json(
      { error: "兑换码格式不正确，应为 XZ-XXXX-XXXX-XXXX" },
      { status: 400 }
    );
  }

  const hash = sha256Hex(code);
  if (!REDEEM_KEY_HASHES.includes(hash)) {
    return NextResponse.json({ error: "兑换码无效，请核对后重试" }, { status: 404 });
  }

  // 幂等/占用检查
  const existing = await readRedeemed(hash);
  if (existing && existing.userId !== userId) {
    return NextResponse.json(
      { error: "该兑换码已被使用" },
      { status: 409 }
    );
  }

  // 已是终身 Pro 且同一码重复提交 → 幂等成功
  const rec = (await readMembership(userId)) ?? defaultRecord();
  const alreadyLifetime = rec.plan === "pro" && rec.billingCycle === "lifetime";

  if (!alreadyLifetime) {
    const updated = grantPro(rec, "lifetime");
    await writeMembership(userId, updated);
  }

  // 占位记账（同码同用户重复提交不产生副作用）
  if (!existing) {
    await put(
      `redeemed/${hash}`,
      JSON.stringify({ userId, redeemedAt: Date.now() }),
      { access: "private", allowOverwrite: true, contentType: "application/json" }
    );
  }

  const final = alreadyLifetime
    ? rec
    : await readMembership(userId);
  return NextResponse.json({
    ok: true,
    plan: final?.plan ?? "pro",
    billingCycle: final?.billingCycle ?? "lifetime",
    proUntil: final?.proUntil ?? null,
  });
}
