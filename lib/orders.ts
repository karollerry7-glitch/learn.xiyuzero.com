// 订单领域逻辑 — Vercel Blob KV，key = order/{outTradeNo}
// 结算幂等：重复回调 / 主动查单都走 settleOrder，不会重复加时长。

import crypto from "node:crypto";
import { get, put } from "@vercel/blob";
import {
  BillingCycle,
  grantPro,
  readMembership,
  writeMembership,
  MembershipRecord,
} from "./membership";

export type OrderStatus = "created" | "paid" | "closed";

export interface OrderRecord {
  outTradeNo: string; // 商户订单号（6-32 位字母数字）
  userId: string; // 归属用户（结算时只信本字段，绝不信任回调里的用户信息）
  billingCycle: BillingCycle;
  amountCents: number; // 订单金额（分，服务端配置定价）
  status: OrderStatus;
  prepayId?: string;
  transactionId?: string; // 微信支付订单号
  paidAt?: number;
  createdAt: number;
}

/** 商户订单号：XZ + 时间36进制 + 随机，≤32 位字母数字 */
export function newOutTradeNo(): string {
  const t = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `XZ${t}${rand}`.slice(0, 32);
}

function blobKey(outTradeNo: string): string {
  return `order/${outTradeNo}`;
}

export async function readOrder(outTradeNo: string): Promise<OrderRecord | null> {
  try {
    const res = await get(blobKey(outTradeNo), {
      access: "private",
      useCache: false,
    });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return (await new Response(res.stream).json()) as OrderRecord;
  } catch {
    return null;
  }
}

export async function writeOrder(rec: OrderRecord): Promise<void> {
  await put(blobKey(rec.outTradeNo), JSON.stringify(rec), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export type SettleResult = "paid" | "already" | "mismatch";

/**
 * 结算订单：验证金额 → 授予/续期 Pro（grantPro 自动叠加剩余时长）→ 更新订单。
 * 幂等：已 paid 直接返回 already。
 * @param payerTotalCents 微信实收金额（回调 amount.payer_total / 查单 payer_total）
 */
export async function settleOrder(
  rec: OrderRecord,
  transactionId: string,
  payerTotalCents?: number
): Promise<SettleResult> {
  if (rec.status === "paid") return "already";

  // 金额对账（防篡改）：实收必须与订单定价一致
  if (payerTotalCents !== undefined && payerTotalCents !== rec.amountCents) {
    await writeOrder({ ...rec, status: "closed", transactionId });
    return "mismatch";
  }

  const current: MembershipRecord = await readMembership(rec.userId);
  await writeMembership(rec.userId, grantPro(current, rec.billingCycle));
  await writeOrder({
    ...rec,
    status: "paid",
    transactionId,
    paidAt: Date.now(),
  });
  return "paid";
}
