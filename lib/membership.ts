// 会员领域逻辑 — 服务端唯一真源（Phase 4）
// ⚠️ 客户端镜像：xiyuzero-miniprogram/src/config/membership.ts（修改时两端同步）
//
// 数据模型（Vercel Blob KV，key = membership/{userId}）：
//   MembershipRecord {
//     plan: "free" | "pro",
//     billingCycle: "monthly" | "yearly" | "lifetime" | null, // lifetime 预留
//     proUntil: ISO datetime | null,   // lifetime 用远期时间
//     updatedAt: number(ms)
//   }
// 权限判断（isPro / 额度）只在本文件计算，API 路由不得自行散落判断。

import { get, put } from "@vercel/blob";
import { dayKey } from "./datekey";

export type Plan = "free" | "pro";
export type BillingCycle = "monthly" | "yearly" | "lifetime";

export interface MembershipRecord {
  plan: Plan;
  billingCycle: BillingCycle | null;
  proUntil: string | null;
  updatedAt: number;
}

// ---- 与小程序 config/membership.ts 保持同步的常量 ----
export const TOTAL_UNITS = 4505;

// ---- 收费会员已移除（2026-10-22，用户指示）----
// 全部功能对所有用户免费开放；plan/billingCycle/proUntil 字段仅为
// 历史数据兼容保留（不删除用户记录），不再产生任何权益差异。

/** 可售周期价格（分）；一切周期均已下架，购买链路关闭 */
export function priceOfCycle(_cycle: BillingCycle): number | null {
  return null;
}

/**
 * 授予/续期 Pro：从 max(现在, 现有到期时间) 起算，避免续费用户损失剩余时长。
 * 纯函数，可测。写库必须走 writeMembership。
 */
export function grantPro(
  rec: MembershipRecord,
  cycle: BillingCycle,
  now: Date = new Date()
): MembershipRecord {
  const currentEnd = rec.proUntil ? new Date(rec.proUntil).getTime() : 0;
  const base = new Date(Math.max(now.getTime(), currentEnd));
  let end: Date;
  if (cycle === "lifetime") {
    end = new Date("2099-12-31T23:59:59.000Z");
  } else if (cycle === "yearly") {
    end = new Date(base);
    end.setUTCFullYear(end.getUTCFullYear() + 1);
  } else {
    end = new Date(base);
    end.setUTCMonth(end.getUTCMonth() + 1);
  }
  return {
    plan: "pro",
    billingCycle: cycle,
    proUntil: end.toISOString(),
    updatedAt: now.getTime(),
  };
}

export interface MembershipUsage {
  date: string; // 服务端 UTC 日期（YYYY-MM-DD）
  newLearnedToday: number;
}

export interface MembershipView {
  plan: Plan;
  billingCycle: BillingCycle | null;
  proUntil: string | null;
  isPro: boolean;
  entitlements: {
    dailyNewLimit: number | null; // null = 不限
    levels: readonly string[] | null; // null = 全部
    fullVocabulary: boolean;
    smartReview: "basic" | "full";
    stats: "basic" | "full";
    historyDays: number | null;
    cloudSync: "basic" | "full";
  };
  usage: MembershipUsage;
}

function utcToday(): string {
  return dayKey();
}

export function computeIsPro(rec: MembershipRecord, now = Date.now()): boolean {
  if (rec.plan !== "pro") return false;
  if (rec.billingCycle === "lifetime") return true;
  if (!rec.proUntil) return false;
  return new Date(rec.proUntil).getTime() > now;
}

export function defaultRecord(): MembershipRecord {
  return { plan: "free", billingCycle: null, proUntil: null, updatedAt: 0 };
}

function blobKey(userId: string): string {
  return `membership/${userId}`;
}

export async function readMembership(userId: string): Promise<MembershipRecord> {
  try {
    const res = await get(blobKey(userId), {
      access: "private",
      useCache: false,
    });
    if (!res || res.statusCode !== 200 || !res.stream) return defaultRecord();
    const data = (await new Response(res.stream).json()) as MembershipRecord;
    if (data.plan !== "free" && data.plan !== "pro") return defaultRecord();
    return {
      plan: data.plan,
      billingCycle: data.billingCycle ?? null,
      proUntil: data.proUntil ?? null,
      updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : 0,
    };
  } catch {
    return defaultRecord();
  }
}

export async function writeMembership(
  userId: string,
  rec: MembershipRecord
): Promise<void> {
  await put(blobKey(userId), JSON.stringify(rec), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
  });
}

/** 从进度状态的 activity 中取今日新学词数（UTC 日期规则，与客户端记账一致） */
export function usageFromActivity(
  activity: Record<string, { newLearned?: number }>,
  now: Date = new Date()
): MembershipUsage {
  const date = dayKey(now);
  const today = activity[date];
  return { date, newLearnedToday: today?.newLearned ?? 0 };
}

/** 组装对外视图（Entitlement 计算 + 用量）。
 *  收费会员已移除：所有用户一律返回完整权益（原 Pro 权益）。 */
export function membershipView(
  rec: MembershipRecord,
  activity: Record<string, { newLearned?: number }>,
  now: Date = new Date()
): MembershipView {
  const isPro = computeIsPro(rec, now.getTime());
  void isPro; // 历史字段仅供展示，不再影响权益
  return {
    plan: rec.plan,
    billingCycle: rec.billingCycle,
    proUntil: rec.proUntil,
    isPro,
    entitlements: {
      dailyNewLimit: null,
      levels: null,
      fullVocabulary: true,
      smartReview: "full",
      stats: "full",
      historyDays: null,
      cloudSync: "full",
    },
    usage: usageFromActivity(activity, now),
  };
}
