# Image Background Remover — MVP 需求文档

> 版本：v1.0  
> 日期：2026-03-27  
> 负责人：龙虾出海

---

## 一、产品概述

### 1.1 产品定位

一款极简的在线图像背景移除工具，用户上传图片即可获得透明背景的 PNG。用户无需注册、无需等待，即用即走。

**核心理念**：快、免费、隐私安全（图片不存储）。

### 1.2 目标用户

- 电商卖家（需要白底图）
- 设计师（快速去背景）
- 普通人（证件照换背景、处理日常图片）

### 1.3 核心价值主张

> 上传图片 → 3秒获得透明背景图 → 直接下载

---

## 二、用户故事与功能范围

### 2.1 必须有（MVP）

| 用户故事 | 功能点 |
|---------|--------|
| 作为用户，我想上传图片并立即看到去背景的结果 | 图片上传（支持拖拽 + 点击） |
| 作为用户，我想下载处理后的图片 | 一键下载 PNG |
| 作为用户，我想在下载前预览效果 | 实时预览透明背景图 |
| 作为用户，我想知道上传的图片格式是否支持 | 格式校验（jpg/png/webp） |
| 作为用户，我想在手机和电脑上都能用 | 响应式适配（移动端 + 桌面端） |
| 作为运营者，我想防止滥用 | 请求频率限制（每人每天 N 次） |

### 2.2 暂时不做（V2）

- 批量处理多张图片
- 换背景色 / 加阴影
- 用户注册 + 账户体系
- 付费订阅
- 导出多种尺寸
- 历史记录

---

## 三、功能详细说明

### 3.1 图片上传

- **方式**：拖拽上传 + 点击选择文件
- **支持格式**：JPG、PNG、WebP
- **文件大小限制**：≤ 10MB（Remove.bg API 限制）
- **校验时机**：选择文件后立即校验，格式/大小不符时即时提示
- **交互**：上传时显示 loading 状态（禁止重复点击）

### 3.2 背景移除处理

- **调用链路**：前端 → Cloudflare Worker → Remove.bg API → 返回结果 → 前端
- **无存储**：图片全程内存处理，Worker 收到后直接转发
- **错误处理**：
  - API 返回错误 → 显示友好提示（如"图片无法处理，请换一张试试"）
  - 网络超时 → 重试1次，仍失败则提示用户

### 3.3 预览

- 成功后直接在页面显示处理结果
- 预览时自动添加棋盘格背景（展示透明效果）

### 3.4 下载

- 文件名格式：`{原文件名}_nobg.png`
- 点击按钮触发浏览器下载
- 不弹新窗口，不跳转页面

### 3.5 频率限制

- 策略：基于 IP 限流
- 限制：每人每天最多 **10 次**（Remove.bg 免费额度 50张/月，保守设置）
- 超限提示："今日使用次数已用完，请明天再来 👋"

---

## 四、页面结构

### 4.1 只有一个页面

```
┌─────────────────────────────────────┐
│           Header（极简）              │
│     Logo + slogan "3秒去除背景"       │
├─────────────────────────────────────┤
│                                     │
│         [上传区域 / 预览区]            │
│    拖拽图片到这里，或点击选择           │
│                                     │
├─────────────────────────────────────┤
│         [下载按钮]（预览后出现）        │
│         "下载透明背景图"               │
├─────────────────────────────────────┤
│           Footer（极简）              │
│    隐私说明 · 技术支持                 │
└─────────────────────────────────────┘
```

### 4.2 页面状态流转

```
State 1: 空态（默认）
  └→ 上传区域，等待用户拖拽/选择

State 2: 上传中（Loading）
  └→ 显示进度，禁止重复上传

State 3: 处理成功
  └→ 显示预览图 + 下载按钮

State 4: 处理失败
  └→ 显示错误提示 + 重试按钮

State 5: 次数用尽
  └→ 显示限流提示
```

---

## 五、技术方案

### 5.1 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端页面 | 原生 HTML + CSS + JS | 无框架依赖，加载最快 |
| 或：轻量选择 | Next.js + Tailwind | 如果后续功能多 |
| 后端 | Cloudflare Worker | Edge 计算，中转 Remove.bg API |
| 托管 | Cloudflare Pages | 免费，快速部署 |
| 图片处理 API | Remove.bg | 高质量背景移除，按调用付费 |
| 域名 | Cloudflare 托管 | 自带 HTTPS |
| 无存储 | — | 所有图片不落盘，纯内存/流式 |

### 5.2 Cloudflare Worker 核心逻辑

```
请求进来（POST, multipart/form-data）
  → 校验是否有 file 字段
  → 构造 Remove.bg 请求（替换 API key）
  → 转发到 Remove.bg API
  → 流式返回结果（或完整返回）
  → 设置合适 header（Content-Type: image/png）
```

**关键环境变量**：
- `REMOVE_BG_API_KEY`：隐藏，永不暴露给前端

### 5.3 前端调用 Worker

```javascript
const formData = new FormData();
formData.append("image_file", file);
formData.append("size", "auto");
formData.append("format", "png");

const res = await fetch("https://your-worker.workers.dev/remove", {
  method: "POST",
  body: formData,
});

if (res.ok) {
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  // 显示预览 + 绑定下载
} else {
  // 显示错误
}
```

### 5.4 IP 限流实现

- Worker 内读取请求 IP
- 使用 Cloudflare KV 存储计数（`ip → count`）
- 每天 00:00 自动过期（TTL）

### 5.5 目录结构

```
/removebg-mvp
├── src/
│   ├── index.html        # 主页面
│   ├── style.css         # 样式
│   └── app.js            # 前端逻辑
├── workers/
│   └── removebg/
│       └── index.js      # Cloudflare Worker
├── wrangler.toml         # Worker 配置
└── README.md
```

---

## 六、非功能性需求

### 6.1 性能

- 页面加载时间：< 2秒（打开即用）
- 图片处理时间：Remove.bg 通常 2-5 秒
- Worker 响应时间：< 100ms（中转开销）

### 6.2 隐私

- 图片不存储在任何地方
- 不使用 Cookie
- 不追踪用户行为

### 6.3 兼容性

- 浏览器：Chrome、Firefox、Safari、Edge（最新版）
- 移动端：iOS Safari、Android Chrome

### 6.4 可用性

- Cloudflare Pages + Workers SLA：99.9%+
- 监控：错误日志（Cloudflare Analytics 免费）

---

## 七、上线检查清单

### 上线前必查

- [ ] Remove.bg API Key 配置到 Worker 环境变量
- [ ] 域名解析到 Cloudflare Pages
- [ ] HTTPS 已启用（Cloudflare 自动）
- [ ] 测试 JPG / PNG / WebP 三种格式
- [ ] 测试大文件（10MB）被正确拒绝
- [ ] 测试限流逻辑（超过10次被拦截）
- [ ] 测试移动端布局正常
- [ ] 错误提示文案友好

---

## 八、迭代计划

### MVP（当前）

- 单页应用
- 基础上传 + 去背景 + 下载
- IP 限流

### V2（后续）

- 批量处理
- 换背景色
- 电商场景预设尺寸

---

## 九、成本估算（月）

| 项目 | 方案 | 月费用 |
|------|------|--------|
| 域名 | 已有或新购 | $0–$10 |
| Cloudflare Pages | 免费 | $0 |
| Cloudflare Worker | 免费（每天10万请求） | $0 |
| Remove.bg | 免费50张/月 | $0 |
| Remove.bg（超免费额度后） | $0.02/张 | 取决于用量 |

**MVP 阶段成本：$0**

---

## 十、附录

### A. Remove.bg API 文档

- 端点：`https://api.remove.bg/v1.0/removebg`
- 认证：`X-Api-Key` header
- 参数：`image_file`（文件）、`size`（auto/precise）、`format`（png/jpg）

### B. Cloudflare Worker 限制

- 请求体最大：100MB
- Worker 执行时间：CPU 时间 50ms（绑定脚本）/ 30s（unbound）
- 内存：512MB

### C. 参考竞品

- [remove.bg](https://www.remove.bg) — 市场领导者
- [Photoroom](https://www.photoroom.com) — 有 App，电商场景强
- [Clipdrop](https://clipdrop.co) — 生态丰富，免费额度大

---

*文档版本：v1.0 | 最后更新：2026-03-27*
