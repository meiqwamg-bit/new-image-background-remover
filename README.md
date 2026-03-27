# new-image-background-remover

> 🖼️ 极简在线图像背景移除工具 — 3秒完成，上传即走，不存图片

[在线体验] | [需求文档](./docs/removebg-mvp.md) | [前端说明](./frontend/README.md)

---

## 功能特点

- ✅ 3秒完成背景移除
- ✅ 纯浏览器端预览，图片不经过任何服务器存储
- ✅ 支持 JPG / PNG / WebP
- ✅ 移动端友好
- ✅ 免费使用，无需注册

---

## 项目结构

```
new-image-background-remover/
├── frontend/                    # Next.js + Tailwind CSS 前端
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── page.tsx         # 主页面
│   │   │   ├── layout.tsx       # 布局
│   │   │   └── globals.css      # 全局样式
│   │   └── lib/                 # 工具函数
│   ├── public/                  # 静态资源
│   ├── .env.local.example       # 环境变量示例
│   └── README.md                # 前端说明
├── workers/
│   └── removebg/
│       └── index.js             # Cloudflare Worker
├── docs/
│   └── removebg-mvp.md          # MVP 需求文档
├── wrangler.toml                # Worker 配置
└── README.md
```

---

## 技术架构

```
用户浏览器
    ↓ 上传图片
Cloudflare Worker（API 中转）
    ↓ 调用
Remove.bg API
    ↓ 返回透明图
用户下载
```

- **前端**：Next.js 15 + Tailwind CSS + TypeScript
- **后端**：Cloudflare Worker（中转层，隐藏 API Key）
- **图片处理**：Remove.bg API
- **托管**：Cloudflare Pages
- **费用**：MVP 阶段 $0

---

## 快速部署

### 1. 部署 Worker

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 KV Namespace（用于限流）
wrangler kv:namespace create "RATE_LIMIT_KV"

# 编辑 workers/removebg/index.js 中的 KV namespace binding
# 编辑 wrangler.toml 填入你的 KV namespace ID

# 部署 Worker
wrangler deploy
```

### 2. 部署前端

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入 Worker URL

# 本地测试
npm run dev

# 构建并部署到 Cloudflare Pages
npm run build
# 然后在 Cloudflare Dashboard 上传 .next 目录
```

---

## 环境变量

### 前端（frontend/.env.local）

```env
NEXT_PUBLIC_WORKER_URL=https://your-worker.workers.dev/remove
```

### Worker（wrangler.toml / Cloudflare Dashboard）

```env
REMOVE_BG_API_KEY=your-remove.bg-api-key
```

---

## License

MIT
