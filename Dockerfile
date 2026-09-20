# ============ 西语Zero 后端容器镜像（微信云托管 / 任意容器平台） ============
# 用途：把 learn.xiyuzero.com 的 Next.js API 部署到微信云托管，
#      小程序通过 callContainer 直连（免域名备案、免合法域名校验）。
# 数据层不变：仍使用 Vercel Blob（环境变量 BLOB_READ_WRITE_TOKEN 照常注入）。
#
# 本地验证：docker build -t xzy-api . && docker run -p 3000:3000 \
#   -e BLOB_READ_WRITE_TOKEN=... -e AUTH_SECRET=... xzy-api

# ---- 构建阶段 ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ENV DOCKER_BUILD=1 NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- 运行阶段 ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=80 HOSTNAME=0.0.0.0
# standalone 产物（server.js + 最小 node_modules）
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 80
CMD ["node", "server.js"]
