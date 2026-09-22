// 用户资料（昵称）— Vercel Blob 存储
// 契约：
//   - key: userprofile/{userId}（private）
//   - { nickname, updatedAt }
//   - 未设置过昵称 → null（登录响应给默认昵称「西语学员」+ isNew=true）

import { get, put } from "@vercel/blob";

export const DEFAULT_NICKNAME = "西语学员";

export interface UserProfile {
  nickname: string;
  updatedAt: number;
}

export async function readUserProfile(
  userId: string
): Promise<UserProfile | null> {
  try {
    const res = await get(`userprofile/${userId}`, {
      access: "private",
      useCache: false,
    });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return (await new Response(res.stream).json()) as UserProfile;
  } catch {
    return null;
  }
}

export async function writeUserProfile(
  userId: string,
  nickname: string
): Promise<void> {
  await put(
    `userprofile/${userId}`,
    JSON.stringify({ nickname, updatedAt: Date.now() }),
    { access: "private", allowOverwrite: true, contentType: "application/json" }
  );
}

/** 昵称校验：去首尾空格后 1~16 字符，过滤纯空白 */
export function sanitizeNickname(raw: string): string | null {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s || s.length > 16) return null;
  return s;
}
