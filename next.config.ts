import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 全静态导出：所有页面均为静态内容（数据存 LocalStorage），
  // 部署最简单，且天然规避 Windows 本地构建的 symlink 问题。
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
