# new-image-background-remover

> 🖼️ 极简在线图像背景移除工具 — 3秒完成，上传即走，不存图片

[在线体验] | [需求文档](./docs/removebg-mvp.md)

---

## 功能特点

- ✅ 3秒完成背景移除
- ✅ 纯浏览器端预览，图片不经过任何服务器存储
- ✅ 支持 JPG / PNG / WebP
- ✅ 移动端友好
- ✅ 免费使用，无需注册

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

- **前端**：原生 HTML/CSS/JS，无框架依赖
- **后端**：Cloudflare Worker（中转层，隐藏 API Key）
- **图片处理**：Remove.bg API
- **托管**：Cloudflare Pages + Cloudflare Workers
- **费用**：MVP 阶段 $0

---

## 本地开发

### 前端（直接打开）

```bash
# 直接用浏览器打开 src/index.html 即可
open src/index.html
```

### Worker 开发

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 本地预览 Worker
wrangler dev

# 部署 Worker
wrangler deploy
```

### 配置

1. 复制 `wrangler.toml.example` 为 `wrangler.toml`
2. 在 [Remove.bg](https://www.remove.bg/api) 申请 API Key
3. 在 Cloudflare Workers 设置环境变量 `REMOVE_BG_API_KEY`

---

## 项目结构

```
new-image-background-remover/
├── src/
│   ├── index.html       # 主页面
│   ├── style.css        # 样式
│   └── app.js           # 前端逻辑
├── workers/
│   └── removebg/
│       └── index.js     # Cloudflare Worker
├── docs/
│   └── removebg-mvp.md  # MVP 需求文档
├── wrangler.toml        # Worker 配置
├── .gitignore
└── README.md
```

---

## License

MIT
