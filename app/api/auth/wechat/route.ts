// POST /api/auth/wechat — 小程序微信登录
// 契约（小程序 src/services/auth.ts）：POST { code } → { token, expiresIn, user }
//
// 两种模式（由环境变量决定，Vercel Project Settings → Environment Variables）：
//  1. 正式模式：设置 WX_APPID + WX_APP_SECRET → 真实 code2Session，openid 派生稳定用户 id
//  2. 开发模式（未配置密钥时自动启用）：按 code 派生游客身份，token 标记 dev=true，
//     仅用于开发期打通链路；上线前必须配置 WX_APPID/WX_APP_SECRET 关闭此模式。
//
// token 为 HMAC-SHA256 签名的无状态令牌（本项目无数据库，用户状态后续再服务端化）。

import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { put } from "@vercel/blob";
import { signToken } from "@/lib/auth";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 天

interface SessionPayload {
  sub: string; // 用户 id（openid 派生，openid 永不直接暴露）
  exp: number; // 过期时间戳（秒）
  dev?: boolean; // 是否开发模式令牌
}

/** openid → 稳定用户 id（永不直接用 openid 当业务 id） */
function deriveUserId(openid: string): string {
  return "u_" + crypto.createHash("sha256").update(openid).digest("hex").slice(0, 16);
}

export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "缺少 code" }, { status: 400 });
  }

  const appid = process.env.WX_APPID;
  const secret = process.env.WX_APP_SECRET;

  let openid: string;
  let devMode = false;

  if (appid && secret) {
    // ---- 正式模式：code2Session ----
    const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
    url.searchParams.set("appid", appid);
    url.searchParams.set("secret", secret);
    url.searchParams.set("js_code", code);
    url.searchParams.set("grant_type", "authorization_code");
    try {
      const wxRes = await fetch(url, { cache: "no-store" });
      const wxData = (await wxRes.json()) as {
        openid?: string;
        errcode?: number;
        errmsg?: string;
      };
      if (!wxData.openid) {
        return NextResponse.json(
          {
            error: `微信登录失败（${wxData.errcode ?? "?"}）：${wxData.errmsg ?? "未知错误"}`,
          },
          { status: 502 }
        );
      }
      openid = wxData.openid;
    } catch {
      return NextResponse.json({ error: "无法连接微信服务器" }, { status: 502 });
    }
  } else {
    // ---- 开发模式：按 code 派生游客身份（同一 code 稳定）----
    devMode = true;
    openid = "dev:" + crypto.createHash("sha256").update(code).digest("hex").slice(0, 24);
  }

  const userId = deriveUserId(openid);
  const now = Math.floor(Date.now() / 1000);

  // 持久化 openid 映射（支付下单时定位支付人；失败不阻断登录）
  try {
    await put(
      `useropenid/${userId}`,
      JSON.stringify({ openid, updatedAt: Date.now() }),
      { access: "private", allowOverwrite: true, contentType: "application/json" }
    );
  } catch {
    /* 非关键路径 */
  }

  const payload: SessionPayload = {
    sub: userId,
    exp: now + TOKEN_TTL_SECONDS,
    ...(devMode ? { dev: true } : {}),
  };

  return NextResponse.json({
    token: signToken(payload),
    expiresIn: TOKEN_TTL_SECONDS,
    user: {
      id: userId,
      nickname: "西语学员",
      avatar: null,
      isNew: true,
    },
  });
}
