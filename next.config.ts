import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 标准 Next.js 模式：页面仍为静态预渲染（数据存 LocalStorage），
  // 同时支持 /api/tts 服务端路由（云端真人级发音代理）。
  images: { unoptimized: true },
  // 容器化部署（微信云托管等）用 standalone 产物；Vercel 构建不受影响。
  // Dockerfile 内会设置 DOCKER_BUILD=1。
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
};

export default nextConfig;
