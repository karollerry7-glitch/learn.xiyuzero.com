#!/usr/bin/env bash
# ============ 微信云托管一键部署脚本 ============
# 前置条件（只需一次）：
#   1. 云托管控制台已开通环境（记下环境 ID，形如 prod-xxxx）
#   2. 云托管控制台 → 设置 → 全局设置 → CLI 密钥 → 生成密钥（管理员扫码）
#      密钥文件保存为 learn.xiyuzero.com/cloudbase.key（已 gitignore）
#   3. Vercel 生产环境变量已拉取：npx vercel env pull --environment=production .env.production.local
#
# 用法：bash scripts/deploy-cloudbase.sh <环境ID>
set -euo pipefail

ENV_ID="${1:?用法: bash scripts/deploy-cloudbase.sh <环境ID>}"
APPID="wxccbb540a3394ce9d"
SERVICE="xiyuzero-api"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY_FILE="$ROOT/cloudbase.key"
ENV_FILE="$ROOT/.env.production.local"
WXBIN="/Users/madrid/.workbuddy/binaries/node/workspace/node_modules/.bin/wxcloud"

[ -f "$KEY_FILE" ] || { echo "✗ 缺少 CLI 密钥 $KEY_FILE（控制台-设置-全局设置-CLI密钥 生成）"; exit 1; }
[ -f "$ENV_FILE" ] || { echo "✗ 缺少 $ENV_FILE（npx vercel env pull --environment=production .env.production.local）"; exit 1; }

# 从生产 env 文件读取变量（不回显值）
read_env() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2-; }
AUTH_SECRET=$(read_env AUTH_SECRET)
BLOB_TOKEN=$(read_env BLOB_READ_WRITE_TOKEN)
WX_APPID=$(read_env WX_APPID)
WX_APP_SECRET=$(read_env WX_APP_SECRET)
[ -n "$AUTH_SECRET" ] && [ -n "$BLOB_TOKEN" ] && [ -n "$WX_APPID" ] && [ -n "$WX_APP_SECRET" ] \
  || { echo "✗ .env.production.local 缺少必要变量"; exit 1; }

echo "==> 1/2 登录 CLI（AppID $APPID）"
"$WXBIN" login --appId="$APPID" --privateKey="$KEY_FILE"

echo "==> 2/2 部署 $SERVICE 到环境 $ENV_ID（云端构建 Dockerfile，约 5-10 分钟）"
cd "$ROOT"
"$WXBIN" run:deploy . \
  --envId="$ENV_ID" \
  --serviceName="$SERVICE" \
  --containerPort=3000 \
  --releaseType=FULL \
  --noConfirm \
  --remark="西语Zero API $(date +%Y%m%d-%H%M)" \
  --envParams="AUTH_SECRET=$AUTH_SECRET&BLOB_READ_WRITE_TOKEN=$BLOB_TOKEN&WX_APPID=$WX_APPID&WX_APP_SECRET=$WX_APP_SECRET"

echo ""
echo "✓ 部署命令已提交。完成后用下面命令拿默认域名（小程序 TTS 需要）："
echo "  $WXBIN service:list --envId=$ENV_ID"
