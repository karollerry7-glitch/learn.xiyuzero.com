// GET /api/membership — 小程序 Entitlement 层的服务端视图（Phase 4）
//
// 返回：plan / billingCycle / proUntil / isPro / entitlements / usage
// usage.newLearnedToday 取自该用户云端进度 activity[today].newLearned（UTC 日期规则），
// 与客户端本地记账一致 —— 重装后登录拉取进度即恢复，额度不可轻易重置。
// Pro 判定不信任客户端：isPro 由本接口实时计算（过期自动降级）。

import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { authUserId } from "@/lib/auth";
import { membershipView, readMembership } from "@/lib/membership";

export const runtime = "nodejs";

async function readProgressActivity(
  userId: string
): Promise<Record<string, { newLearned?: number }>> {
  try {
    const res = await get(`progress/${userId}`, {
      access: "private",
      useCache: false,
    });
    if (!res || res.statusCode !== 200 || !res.stream) return {};
    const data = (await new Response(res.stream).json()) as {
      activity?: Record<string, { newLearned?: number }>;
    };
    return data.activity && typeof data.activity === "object" ? data.activity : {};
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const userId = authUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "未登录或令牌无效" }, { status: 401 });
  }
  const rec = await readMembership(userId);
  const activity = await readProgressActivity(userId);
  return NextResponse.json(membershipView(rec, activity));
}
