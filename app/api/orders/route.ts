// POST /api/orders — 支付订单接口占位（Phase 4，第一版不接真实支付）
//
// 未来实现（微信支付 v3）：
//   1. 小程序端 wx.requestPayment 唤起支付
//   2. 本接口创建订单 → 微信下单 → 返回 payParams
//   3. 支付回调（/api/orders/notify）验签 → 写 membership/{userId}（lib/membership）
// 数据模型已在 lib/membership.ts 预留 monthly / yearly / lifetime 三种 billingCycle。
// 第一版策略：所有购买请求一律 501，价格展示与权益判断先行。

import { NextRequest, NextResponse } from "next/server";
import { authUserId } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const userId = authUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "未登录或令牌无效" }, { status: 401 });
  }
  return NextResponse.json(
    {
      error: "支付功能尚未开放，敬请期待",
      code: "PAYMENT_NOT_AVAILABLE",
    },
    { status: 501 }
  );
}
