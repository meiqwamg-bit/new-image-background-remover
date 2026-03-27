#!/bash
# deploy-worker.sh - 一键部署 Remove.bg Cloudflare Worker
# 使用方法: bash deploy-worker.sh

set -e

echo "🔧 开始部署 Remove.bg Worker..."

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 需要先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 2. 安装 Wrangler
echo "📦 安装 Wrangler CLI..."
npm install -g wrangler

# 3. 登录 Cloudflare
echo "🌐 请在浏览器中登录 Cloudflare..."
wrangler login

# 4. 创建 KV Namespace（用于限流）
echo "📦 创建限流 KV 命名空间..."
KV_RESPONSE=$(wrangler kv:namespace create "RATE_LIMIT_KV")
echo "$KV_RESPONSE"

# 提取 KV ID
KV_ID=$(echo "$KV_RESPONSE" | grep -oP '"id":\s*"\K[^"]+' | head -1)
if [ -z "$KV_ID" ]; then
    echo "❌ KV Namespace 创建失败"
    exit 1
fi

echo "✅ KV Namespace ID: $KV_ID"

# 5. 更新 wrangler.toml
echo "📝 更新 wrangler.toml..."
sed -i "s/YOUR_KV_NAMESPACE_ID_HERE/$KV_ID/" workers/removebg/wrangler.toml

# 6. 设置 API Key
echo "🔑 请输入你的 Remove.bg API Key（已提供：yTrC87kL8SBydhFh18wnCokb）:"
read -r API_KEY
if [ -z "$API_KEY" ]; then
    API_KEY="yTrC87kL8SBydhFh18wnCokb"
fi

# 7. 部署 Worker
echo "🚀 部署 Worker..."
wrangler deploy

# 8. 获取 Worker URL
echo ""
echo "✅ 部署完成！"
echo "🌐 你的 Worker URL 是: https://removebg-worker.YOUR_SUBDOMAIN.workers.dev"
echo ""
echo "📋 下一步："
echo "   1. 在 frontend/.env.local 中设置 NEXT_PUBLIC_WORKER_URL"
echo "   2. 部署前端到 Vercel 或 Cloudflare Pages"
echo "   3. 测试完整流程！"
