// POST /api/membership/dev-plan — 会员方案开发模拟（仅测试环境，Phase 4）
//
// 用途：自动测试中模拟 Pro 权限 / 会员过期降级，验证 Entitlement 全链路。
// 安全：仅当环境变量 MEMBERSHIP_DEV_MOCK=1 时可用；生产 Vercel 未设置 → 404。
// 真实会员写入必须走未来的 Payment / Order 回调（见 /api/orders 占位）。

import { NextRequest, NextResponse } from "next/server";
import { authUserId } from "@/lib/auth";
import { readMembership, writeMembership } from "@/lib/membership";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (process.env.MEMBERSHIP_DEV_MOCK !== "1") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
  const userId = authUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "未登录或令牌无效" }, { status: 401 });
  }
  let body: {
    plan?: "free" | "pro";
    billingCycle?: "monthly" | "yearly" | "lifetime" | null;
    proUntil?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }
  if (body.plan !== "free" && body.plan !== "pro") {
    return NextResponse.json({ error: "plan 必须是 free 或 pro" }, { status: 400 });
  }

  const prev = await readMembership(userId);
  const rec = {
    plan: body.plan,
    billingCycle: body.billingCycle ?? null,
    proUntil: body.proUntil ?? null,
    updatedAt: Date.now(),
  };
  await writeMembership(userId, rec);
  return NextResponse.json({ ok: true, prev, now: rec });
}
