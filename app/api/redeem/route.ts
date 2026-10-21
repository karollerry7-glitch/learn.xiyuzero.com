// POST /api/redeem — 兑换码激活（已下线）
//
// 收费会员于 2026-10-22 移除（用户指示）：兑换活动结束，全部功能免费开放。
// 历史兑换记录（redeemed/{hash}）与已激活用户的会员数据保留不动，不删除。
// 旧版本小程序客户端可能仍调用本接口 → 一律返回 410 与明确中文提示。

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  void req;
  return NextResponse.json(
    {
      error: "兑换活动已结束：全部功能已免费开放，无需激活",
      code: "SALES_DISCONTINUED",
    },
    { status: 410 }
  );
}
