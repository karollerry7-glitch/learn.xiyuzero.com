// 微信支付 v3 + 订单/会员领域逻辑单元测试（纯函数，无网络）
// 运行：npm run test:unit（tsx --test）

import { test } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import {
  buildAuthorizationMessage,
  signMessage,
  verifyWithKey,
  decryptAesGcm,
  jsapiSignMessage,
} from "../lib/wxpay";
import {
  priceOfCycle,
  grantPro,
  MembershipRecord,
} from "../lib/membership";
import { newOutTradeNo } from "../lib/orders";

// ---- RSA 密钥对（模拟商户私钥 + 平台公钥） ----
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const privPem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;
const pubPem = publicKey.export({ type: "spki", format: "pem" }) as string;

test("v3 签名原文格式：METHOD\\nURL\\nTS\\nNONCE\\nBODY\\n", () => {
  const msg = buildAuthorizationMessage(
    "POST",
    "/v3/pay/transactions/jsapi",
    "1700000000",
    "abc123",
    '{"k":1}'
  );
  assert.equal(
    msg,
    'POST\n/v3/pay/transactions/jsapi\n1700000000\nabc123\n{"k":1}\n'
  );
});

test("RSA-SHA256 签名/验签往返", () => {
  const message = "POST\n/v3/pay\n1\nnonce\nbody\n";
  const sig = signMessage(privPem, message);
  assert.equal(verifyWithKey(pubPem, message, sig), true);
  // 篡改消息后验签必须失败
  assert.equal(verifyWithKey(pubPem, message + "x", sig), false);
  // 错误公钥必须失败
  const other = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const otherPub = other.publicKey.export({ type: "spki", format: "pem" }) as string;
  assert.equal(verifyWithKey(otherPub, message, sig), false);
});

test("AES-256-GCM 解密（回调 resource / 平台证书同算法）", () => {
  const key = crypto.randomBytes(32);
  const nonce = crypto.randomBytes(12).toString("hex"); // 微信 nonce 允许字符串
  const aad = "transaction";
  const plaintext = JSON.stringify({
    out_trade_no: "XZTEST123",
    trade_state: "SUCCESS",
  });
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(aad));
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const out = decryptAesGcm(key, nonce, enc.toString("base64"), aad);
  assert.equal(out, plaintext);
  // AAD 不匹配必须解密失败（防篡改）
  assert.throws(() =>
    decryptAesGcm(key, nonce, enc.toString("base64"), "tampered")
  );
});

test("JSAPI paySign 原文与签名验证", () => {
  const appId = "wxccbb540a3394ce9d";
  const timeStamp = "1700000000";
  const nonceStr = "nonce";
  const pkg = "prepay_id=wx123456";
  const message = jsapiSignMessage(appId, timeStamp, nonceStr, pkg);
  assert.equal(message, `wxccbb540a3394ce9d\n1700000000\nnonce\nprepay_id=wx123456\n`);
  const paySign = signMessage(privPem, message);
  assert.equal(verifyWithKey(pubPem, message, paySign), true);
});

test("定价：服务端唯一真源（分）", () => {
  assert.equal(priceOfCycle("monthly"), 1990); // ¥19.9
  assert.equal(priceOfCycle("yearly"), 2990); // ¥29.9/年（唯一在售）
  assert.equal(priceOfCycle("lifetime"), null); // 已下架
});

test("grantPro：Free → 月卡 +1 个月", () => {
  const free: MembershipRecord = {
    plan: "free",
    billingCycle: null,
    proUntil: null,
    updatedAt: 0,
  };
  const now = new Date("2026-09-21T00:00:00Z");
  const r = grantPro(free, "monthly", now);
  assert.equal(r.plan, "pro");
  assert.equal(r.billingCycle, "monthly");
  assert.equal(r.proUntil, "2026-10-21T00:00:00.000Z");
});

test("grantPro：年卡续期叠加剩余时长（不损失）", () => {
  // 当前 Pro 还有 3 个月到期 → 续年卡应从到期时间起算
  const active: MembershipRecord = {
    plan: "pro",
    billingCycle: "monthly",
    proUntil: "2026-12-21T00:00:00.000Z",
    updatedAt: 1,
  };
  const now = new Date("2026-09-21T00:00:00Z");
  const r = grantPro(active, "yearly", now);
  assert.equal(r.proUntil, "2027-12-21T00:00:00.000Z");
  assert.equal(r.billingCycle, "yearly");
});

test("grantPro：lifetime 远期时间", () => {
  const r = grantPro(
    { plan: "free", billingCycle: null, proUntil: null, updatedAt: 0 },
    "lifetime",
    new Date("2026-09-21T00:00:00Z")
  );
  assert.equal(r.billingCycle, "lifetime");
  assert.equal(new Date(r.proUntil!).getUTCFullYear(), 2099);
});

test("商户订单号：XZ 前缀、大写字母数字、≤32 位、唯一", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 500; i++) {
    const no = newOutTradeNo();
    assert.match(no, /^XZ[0-9A-Z]+$/);
    assert.ok(no.length >= 6 && no.length <= 32, `长度 ${no.length}`);
    seen.add(no);
  }
  assert.equal(seen.size, 500);
});
