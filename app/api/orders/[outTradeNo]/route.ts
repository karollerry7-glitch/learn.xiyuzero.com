// GET /api/orders/[outTradeNo] — 订单状态查询（小程序支付后轮询）
// 若订单仍为 created 且已配置支付，会顺带向微信查单补结算
// （回调丢失时兜底：trade_state=SUCCESS → settleOrder）。

import { NextRequest, NextResponse } from "next/server";
import { authUserId } from "@/lib/auth";
import { readOrder, settleOrder, writeOrder } from "@/lib/orders";
import { wxpayConfigured, v3Request } from "@/lib/wxpay";

export const runtime = "nodejs";

interface WxQueryResponse {
  trade_state: string;
  transaction_id?: string;
  amount?: { payer_total?: number };
}

const TERMINAL_STATES = ["CLOSED", "REVOKED", "PAYERROR"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ outTradeNo: string }> }
) {
  const userId = authUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "未登录或令牌无效" }, { status: 401 });
  }
  const { outTradeNo } = await params;

  const rec = await readOrder(outTradeNo);
  // 不存在或非本人订单：一律 404，不泄露订单存在性
  if (!rec || rec.userId !== userId) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  // 未支付订单：向微信查单兜底（处理回调延迟/丢失）
  if (rec.status === "created" && wxpayConfigured()) {
    try {
      const q = await v3Request<WxQueryResponse>(
        "GET",
        `/v3/pay/transactions/out-trade-no/${encodeURIComponent(
          outTradeNo
        )}?mchid=${encodeURIComponent(process.env.WXPAY_MCHID!)}`
      );
      if (q.trade_state === "SUCCESS" && q.transaction_id) {
        await settleOrder(rec, q.transaction_id, q.amount?.payer_total);
      } else if (TERMINAL_STATES.includes(q.trade_state)) {
        await writeOrder({ ...rec, status: "closed" });
      }
    } catch {
      /* 查单失败不影响返回本地状态 */
    }
  }

  const latest = (await readOrder(outTradeNo)) ?? rec;
  return NextResponse.json({
    orderId: latest.outTradeNo,
    status: latest.status,
    billingCycle: latest.billingCycle,
    amountCents: latest.amountCents,
    paidAt: latest.paidAt ?? null,
    createdAt: latest.createdAt,
  });
}
