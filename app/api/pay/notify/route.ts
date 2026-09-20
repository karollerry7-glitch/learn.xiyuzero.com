// POST /api/pay/notify — 微信支付回调（v3）
// 安全链路：平台证书验签（Wechatpay-Serial 定位公钥）→ AES-256-GCM 解密
//          → 金额对账 → settleOrder（幂等 + 只信任订单内 userId）
// 响应契约：成功 {"code":"SUCCESS"} 200；失败非 200 + {"code":"FAIL"} 微信会重试。

import { NextRequest, NextResponse } from "next/server";
import { readOrder, settleOrder } from "@/lib/orders";
import {
  wxpayConfigured,
  verifyCallbackSignature,
  decryptNotifyResource,
} from "@/lib/wxpay";

export const runtime = "nodejs";

interface NotifyBody {
  event_type?: string;
  resource?: {
    ciphertext: string;
    nonce: string;
    associated_data?: string;
  };
}

function fail(message: string, status = 500) {
  return NextResponse.json({ code: "FAIL", message }, { status });
}

export async function POST(req: NextRequest) {
  if (!wxpayConfigured()) {
    // 未配置支付却收到回调：多半是探测，拒绝
    return fail("not configured", 404);
  }

  const rawBody = await req.text();
  const timestamp = req.headers.get("wechatpay-timestamp") || "";
  const nonce = req.headers.get("wechatpay-nonce") || "";
  const signature = req.headers.get("wechatpay-signature") || "";
  const serial = req.headers.get("wechatpay-serial") || "";

  if (!timestamp || !nonce || !signature || !serial) {
    return fail("缺少验签头", 400);
  }

  const ok = await verifyCallbackSignature(
    timestamp,
    nonce,
    rawBody,
    signature,
    serial
  );
  if (!ok) {
    return fail("签名验证失败", 400);
  }

  let body: NotifyBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return fail("请求体不是 JSON", 400);
  }

  // 只处理支付成功事件；其余（退款等）先 ACK，后续按需扩展
  if (body.event_type !== "TRANSACTION.SUCCESS" || !body.resource) {
    return NextResponse.json({ code: "SUCCESS", message: "OK" });
  }

  let resource;
  try {
    resource = decryptNotifyResource(body.resource);
  } catch {
    return fail("解密失败", 400);
  }

  const rec = await readOrder(resource.out_trade_no);
  if (!rec) {
    return fail("订单不存在", 404);
  }

  const result = await settleOrder(
    rec,
    resource.transaction_id,
    resource.amount?.payer_total
  );

  if (result === "mismatch") {
    return fail("金额不一致", 400);
  }
  return NextResponse.json({ code: "SUCCESS", message: "OK" });
}

export async function GET() {
  return NextResponse.json(
    { code: "FAIL", message: "method not allowed" },
    { status: 405 }
  );
}
