// POST /api/orders — 创建微信支付订单（JSAPI）
// 未配置商户号时保持 501 PAYMENT_NOT_AVAILABLE（第一版不接真实支付）。
//
// 流程：小程序 { billingCycle } → 服务端定价 → 落订单（order/{outTradeNo}）
//       → 微信 /v3/pay/transactions/jsapi → prepay_id → paySign 下发
//       → 小程序 wx.requestPayment → 支付回调 /api/pay/notify 结算
//
// ⚠️ 金额只信服务端 priceOfCycle（lib/membership 统一配置），客户端不传价格。

import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { authUserId } from "@/lib/auth";
import { BillingCycle, priceOfCycle } from "@/lib/membership";
import { newOutTradeNo, writeOrder, OrderRecord } from "@/lib/orders";
import {
  wxpayConfigured,
  v3Request,
  WxPayError,
  buildJsapiPayParams,
} from "@/lib/wxpay";

export const runtime = "nodejs";

interface JsapiOrderResponse {
  prepay_id: string;
}

/** 登录时写入的 openid 映射（useropenid/{userId}） */
async function readPayerOpenid(userId: string): Promise<string | null> {
  try {
    const res = await get(`useropenid/${userId}`, {
      access: "private",
      useCache: false,
    });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    const data = (await new Response(res.stream).json()) as { openid?: string };
    return data.openid ?? null;
  } catch {
    return null;
  }
}

const PLAN_NAME: Record<string, string> = {
  monthly: "西语Zero Pro·月卡",
  yearly: "西语Zero Pro·年卡",
};

export async function POST(req: NextRequest) {
  const userId = authUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "未登录或令牌无效" }, { status: 401 });
  }

  // 第一版：未配置商户号 → 维持占位
  if (!wxpayConfigured()) {
    return NextResponse.json(
      { error: "支付功能尚未开放，敬请期待", code: "PAYMENT_NOT_AVAILABLE" },
      { status: 501 }
    );
  }

  let body: { billingCycle?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const cycle = body.billingCycle as BillingCycle;
  const amountCents = priceOfCycle(cycle);
  if (amountCents === null) {
    return NextResponse.json(
      { error: "不支持的计费周期（lifetime 暂不售卖）" },
      { status: 400 }
    );
  }

  const openid = await readPayerOpenid(userId);
  if (!openid || openid.startsWith("dev:")) {
    return NextResponse.json(
      {
        error: "支付身份缺失，请退出小程序重新登录后再试",
        code: "NEED_RELOGIN",
      },
      { status: 409 }
    );
  }

  const outTradeNo = newOutTradeNo();
  const rec: OrderRecord = {
    outTradeNo,
    userId,
    billingCycle: cycle,
    amountCents,
    status: "created",
    createdAt: Date.now(),
  };

  try {
    // 先落订单，再向微信下单（失败订单留存对账）
    await writeOrder(rec);

    const wxOrder = await v3Request<JsapiOrderResponse>(
      "POST",
      "/v3/pay/transactions/jsapi",
      {
        appid: process.env.WXPAY_APPID || process.env.WX_APPID,
        mchid: process.env.WXPAY_MCHID,
        description: PLAN_NAME[cycle],
        out_trade_no: outTradeNo,
        notify_url:
          process.env.WXPAY_NOTIFY_URL ||
          "https://learn.xiyuzero.com/api/pay/notify",
        amount: { total: amountCents, currency: "CNY" },
        payer: { openid },
      }
    );

    await writeOrder({ ...rec, prepayId: wxOrder.prepay_id });

    return NextResponse.json({
      orderId: outTradeNo,
      payParams: buildJsapiPayParams(wxOrder.prepay_id),
    });
  } catch (e) {
    if (e instanceof WxPayError) {
      return NextResponse.json(
        { error: `微信下单失败：${e.message}`, code: e.code ?? "WXPAY_ERROR" },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "创建订单失败，请稍后重试" },
      { status: 500 }
    );
  }
}
