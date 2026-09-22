// PATCH /api/profile — 设置昵称（登录后第二步引导填写）
// GET  /api/profile — 读取当前资料
//
// 契约（小程序 services/auth.ts）：PATCH { nickname } → { user }

import { NextRequest, NextResponse } from "next/server";
import { authUserId } from "@/lib/auth";
import {
  readUserProfile,
  writeUserProfile,
  sanitizeNickname,
  DEFAULT_NICKNAME,
} from "@/lib/profile";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = authUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "未登录或令牌无效" }, { status: 401 });
  }
  const profile = await readUserProfile(userId);
  return NextResponse.json({
    user: {
      id: userId,
      nickname: profile?.nickname ?? DEFAULT_NICKNAME,
      avatar: null,
      isNew: !profile,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const userId = authUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "未登录或令牌无效" }, { status: 401 });
  }

  let body: { nickname?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const raw = typeof body.nickname === "string" ? body.nickname : "";
  const nickname = sanitizeNickname(raw);
  if (!nickname) {
    return NextResponse.json(
      { error: "昵称需为 1~16 个字符" },
      { status: 400 }
    );
  }

  try {
    await writeUserProfile(userId, nickname);
  } catch {
    return NextResponse.json({ error: "保存失败，请稍后重试" }, { status: 500 });
  }

  return NextResponse.json({
    user: {
      id: userId,
      nickname,
      avatar: null,
      isNew: false,
    },
  });
}
