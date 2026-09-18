import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 标准 Next.js 模式：页面仍为静态预渲染（数据存 LocalStorage），
  // 同时支持 /api/tts 服务端路由（云端真人级发音代理）。
  images: { unoptimized: true },
};

export default nextConfig;
