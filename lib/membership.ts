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

export type Plan = "free" | "pro";
export type BillingCycle = "monthly" | "yearly" | "lifetime";

export interface MembershipRecord {
  plan: Plan;
  billingCycle: BillingCycle | null;
  proUntil: string | null;
  updatedAt: number;
}

// ---- 与小程序 config/membership.ts 保持同步的常量 ----
export const FREE_DAILY_NEW_WORD_LIMIT = 10;
export const FREE_LEVELS: readonly string[] = ["Starter", "A1"];
export const TOTAL_UNITS = 4505;

// ---- Pro 定价（分；服务端唯一真源，客户端只用于展示） ----
// 售卖方式：单一年费，通过客服微信收款后发兑换码激活（/api/redeem，授予 yearly）。
export const PRO_YEARLY_PRICE_CENTS = 2990; // ¥29.9 / 年（当前唯一在售）
export const PRO_MONTHLY_PRICE_CENTS = 1990; // ¥19.9（历史配置保留）
export const PRO_LIFETIME_PRICE_CENTS = 9990; // ¥99.9（历史配置保留；旧终身数据仍在库）

/** 可售周期价格（分）；当前仅 yearly 在售，lifetime 已下架 */
export function priceOfCycle(cycle: BillingCycle): number | null {
  switch (cycle) {
    case "lifetime":
      return null; // 已下架（存量终身用户仍按 computeIsPro 永久生效）
    case "monthly":
      return PRO_MONTHLY_PRICE_CENTS;
    case "yearly":
      return PRO_YEARLY_PRICE_CENTS;
    default:
      return null;
  }
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
  return new Date().toISOString().slice(0, 10);
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
  const date = now.toISOString().slice(0, 10);
  const today = activity[date];
  return { date, newLearnedToday: today?.newLearned ?? 0 };
}

/** 组装对外视图（Entitlement 计算 + 用量） */
export function membershipView(
  rec: MembershipRecord,
  activity: Record<string, { newLearned?: number }>,
  now: Date = new Date()
): MembershipView {
  const isPro = computeIsPro(rec, now.getTime());
  return {
    plan: rec.plan,
    billingCycle: rec.billingCycle,
    proUntil: rec.proUntil,
    isPro,
    entitlements: isPro
      ? {
          dailyNewLimit: null,
          levels: null,
          fullVocabulary: true,
          smartReview: "full",
          stats: "full",
          historyDays: null,
          cloudSync: "full",
        }
      : {
          dailyNewLimit: FREE_DAILY_NEW_WORD_LIMIT,
          levels: FREE_LEVELS,
          fullVocabulary: false,
          smartReview: "basic",
          stats: "basic",
          historyDays: 7,
          cloudSync: "basic",
        },
    usage: usageFromActivity(activity, now),
  };
}
