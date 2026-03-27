# Image Background Remover — Frontend

> 🖼️ Next.js + Tailwind CSS 实现的前端界面

## 技术栈

- **框架**：Next.js 15 (App Router)
- **样式**：Tailwind CSS 4
- **图标**：Lucide React
- **类型**：TypeScript

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入你的 Cloudflare Worker URL：

```env
NEXT_PUBLIC_WORKER_URL=https://your-worker.workers.dev/remove
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000 查看效果。

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 目录结构

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx      # 主页面（核心逻辑）
│   │   ├── layout.tsx    # 布局
│   │   └── globals.css   # 全局样式
│   └── lib/
│       └── types.ts      # 类型定义
├── public/               # 静态资源
├── .env.local.example    # 环境变量示例
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 部署到 Cloudflare Pages

1. 在 GitHub 创建新仓库（假设为 `removebg-frontend`）
2. 推送 `frontend/` 目录到 GitHub
3. 在 Cloudflare Dashboard 创建 Pages 项目
4. 连接 GitHub 仓库
5. 设置构建命令：`npm run build`
6. 设置输出目录：`.next`
7. 添加环境变量：`NEXT_PUBLIC_WORKER_URL`
8. 部署！

## 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `NEXT_PUBLIC_WORKER_URL` | Cloudflare Worker 的 URL | 是 |

## 功能清单

- ✅ 拖拽或点击上传图片
- ✅ 支持 JPG / PNG / WebP 格式
- ✅ 10MB 文件大小限制
- ✅ 实时预览（棋盘格背景展示透明效果）
- ✅ 一键下载透明 PNG
- ✅ 错误处理与友好提示
- ✅ 每日使用次数限制（本地 localStorage）
- ✅ 完整响应式设计（移动端 + 桌面端）

## License

MIT
