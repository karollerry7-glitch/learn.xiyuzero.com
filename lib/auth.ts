// token 验证 — 与 app/api/auth/wechat/route.ts 的签发逻辑对偶
// HMAC-SHA256 无状态令牌：base64url(json).sig

import crypto from "node:crypto";

export interface SessionPayload {
  sub: string; // 用户 id
  exp: number; // 过期时间戳（秒）
  dev?: boolean; // 是否开发模式令牌
}

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signToken(payload: SessionPayload): string {
  const body = b64url(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", getAuthSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

/** 常数时间字符串比较（防时序侧信道） */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** 验证并解析 token；无效/过期返回 null */
export function verifyToken(token: string): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto
    .createHmac("sha256", getAuthSecret())
    .update(body)
    .digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as SessionPayload;
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** 从请求头解析用户 id；失败返回 null */
export function authUserId(req: Request): string | null {
  const header = req.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const payload = verifyToken(m[1].trim());
  return payload?.sub ?? null;
}
