// GET/POST /api/progress — 小程序学习进度云端同步（Phase 3）
//
// 存储模型：Vercel Blob KV，key = progress/{userId}
// 值 = ProgressState { updatedAt, reviews, activity, prefs }
//
// 同步策略（单用户场景，Last-Write-Wins by updatedAt）：
//  - POST：客户端提交全量状态；若提交的 updatedAt >= 服务端存储值则接受覆盖，
//    否则拒绝（accepted=false），客户端应 GET 服务端状态采纳
//  - GET：返回服务端状态；从未同步过时返回空骨架（updatedAt=0）
// 小程序本地仍保留完整 SRS 计算能力（离线优先），云端是备份与跨设备同步点。
//
// 契约（小程序 src/services/sync.ts）：
//  GET  → { updatedAt, reviews, activity, prefs }
//  POST { updatedAt, reviews, activity, prefs } → { ok, accepted, serverUpdatedAt }

import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";
import { authUserId } from "@/lib/auth";

interface ProgressState {
  updatedAt: number; // 客户端最后一次本地变更的时间戳（ms）
  reviews: Record<string, unknown>;
  activity: Record<string, unknown>;
  prefs?: unknown;
}

// 防滥用上限：词库共 4505 词 + 活动只存 90 天
const MAX_REVIEWS_KEYS = 6000;
const MAX_ACTIVITY_KEYS = 400;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB

function emptyState(): ProgressState {
  return { updatedAt: 0, reviews: {}, activity: {} };
}

function blobKey(userId: string): string {
  return `progress/${userId}`;
}

async function readState(userId: string): Promise<ProgressState> {
  try {
    // useCache:false — 绕过 CDN 缓存强一致读（进度写入后必须立即可读）
    const res = await get(blobKey(userId), {
      access: "private",
      useCache: false,
    });
    if (!res || res.statusCode !== 200 || !res.stream) return emptyState();
    const data = (await new Response(res.stream).json()) as ProgressState;
    if (typeof data.updatedAt !== "number") return emptyState();
    return data;
  } catch {
    return emptyState();
  }
}

function validate(body: unknown): ProgressState | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (
    typeof b.updatedAt !== "number" ||
    b.updatedAt < 0 ||
    typeof b.reviews !== "object" ||
    typeof b.activity !== "object"
  ) {
    return null;
  }
  const reviews = b.reviews as Record<string, unknown>;
  const activity = b.activity as Record<string, unknown>;
  if (
    Object.keys(reviews).length > MAX_REVIEWS_KEYS ||
    Object.keys(activity).length > MAX_ACTIVITY_KEYS
  ) {
    return null;
  }
  return {
    updatedAt: b.updatedAt,
    reviews,
    activity,
    ...(b.prefs !== undefined ? { prefs: b.prefs } : {}),
  };
}

export async function GET(req: NextRequest) {
  const userId = authUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "未登录或令牌无效" }, { status: 401 });
  }
  const state = await readState(userId);
  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  const userId = authUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "未登录或令牌无效" }, { status: 401 });
  }

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "请求体过大" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const state = validate(body);
  if (!state) {
    return NextResponse.json({ error: "状态格式无效" }, { status: 400 });
  }

  const server = await readState(userId);
  if (state.updatedAt >= server.updatedAt) {
    await put(blobKey(userId), JSON.stringify(state), {
      access: "private",
      allowOverwrite: true, // 同 key 覆盖（进度状态的正常更新方式）
      contentType: "application/json",
    });
    return NextResponse.json({
      ok: true,
      accepted: true,
      serverUpdatedAt: state.updatedAt,
    });
  }

  // 服务端更新（可能在另一台设备学过）→ 拒绝覆盖，让客户端拉取
  return NextResponse.json({
    ok: true,
    accepted: false,
    serverUpdatedAt: server.updatedAt,
  });
}
