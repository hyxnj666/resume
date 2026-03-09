# 刘峰 - AI 前端个人网站 / 在线简历

AI Engineer 级别的个人网站：Next.js + TypeScript + Tailwind + shadcn 风格 UI + Framer Motion + **Ask AI about me**。

## 技术栈

- **框架**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS，shadcn 风格组件（Button / Card / Input）
- **动画**: Framer Motion
- **AI**: OpenAI API（简历问答）

## 站点结构

| 路由 | 说明 |
|------|------|
| `/` | 首页：Hero、About、AI 项目、项目、CTA |
| `/resume` | 完整简历 |
| `/projects` | 项目经历 |
| `/ai-projects` | AI 相关项目 |
| `/ask-ai` | **Ask AI about me**：基于简历内容的 AI 问答 |
| `/blog` | Blog 占位（可后续接 MDX） |
| `/contact` | 联系方式 |

## 开发

```bash
pnpm install
pnpm dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

### Ask AI 功能

1. 复制 `.env.example` 为 `.env.local`
2. 在 [OpenAI API Keys](https://platform.openai.com/api-keys) 创建 Key，填入 `OPENAI_API_KEY`
3. 访问 `/ask-ai`，即可向 AI 提问关于简历的问题（如：他是否适合 AI 工程师、做过什么 AI 项目等）

## 构建与部署

```bash
pnpm build
pnpm start
```

### 发布到 Vercel

1. **代码推到 Git**
   - 在 GitHub / GitLab / Bitbucket 新建仓库，把本地的 `resume` 项目推上去（若还没有初始化：`git init` → 提交 → 添加 remote → push）。

2. **在 Vercel 导入项目**
   - 打开 [vercel.com](https://vercel.com)，登录（可用 GitHub 等账号）。
   - 点击 **Add New… → Project**，选择 **Import Git Repository**，选中你的简历仓库。
   - **Framework Preset** 选 **Next.js**，**Root Directory** 保持默认（或填 `resume` 若仓库根目录不是项目根）。
   - 点击 **Deploy**，等第一次构建完成。

3. **配置环境变量（Ask AI 必填）**
   - 进入该项目的 **Settings → Environment Variables**。
   - 新增变量：`OPENAI_API_KEY` = 你的 OpenAI API Key，环境选 **Production**（以及 Preview 若需要）。
   - 保存后可在 **Deployments** 里 **Redeploy** 一次，使新变量生效。

4. **后续更新**
   - 之后只需 `git push` 到该仓库，Vercel 会自动重新构建并发布。

**说明**：`.env.local` 不会随代码上传，所以线上环境必须在 Vercel 里配置 `OPENAI_API_KEY`，否则 Ask AI 会提示未配置。

### 发布到 Cloudflare Pages（免费，国内访问较稳）

本项目已接入 [OpenNext Cloudflare](https://opennext.js.org/cloudflare)，可部署到 Cloudflare Workers/Pages，国内直连通常无需翻墙。

**1. 安装依赖**

```bash
pnpm install
```

**2. 配置环境变量（Ask AI 必填）**

- 本地预览 / 部署前，在项目根目录创建 `.dev.vars`（已有可跳过），生产环境需在 Cloudflare 控制台配置。
- 部署到 Cloudflare 后：**Workers & Pages** → 你的项目 → **Settings** → **Variables and Secrets**，添加 `OPENAI_API_KEY`。

**3. 本地预览 Cloudflare 构建**

```bash
pnpm run preview:cf
```

**4. 部署到 Cloudflare**

- **方式 A：命令行**  
  首次需登录：`pnpm exec wrangler login`，然后执行：
  ```bash
  pnpm run deploy:cf
  ```
  按提示在浏览器完成 Cloudflare 授权后，会生成一个 `*.workers.dev` 或你绑定的域名。

- **方式 B：Git 自动部署**  
  - [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Connect to Git**，选 GitHub 与简历仓库。
  - 构建命令按 Cloudflare 对 OpenNext/Next.js 的说明配置（通常为 `pnpm install && pnpm exec opennextjs-cloudflare build`），并在 **Settings → Variables** 中添加 `OPENAI_API_KEY`。详见 [Cloudflare Workers CI/CD](https://developers.cloudflare.com/workers/ci-cd/)。

部署完成后用分配的网址访问即可。可与 Vercel 同时使用，简历里写两个链接（如「国内访问」「海外访问」）。

**参考**：[OpenNext Cloudflare 文档](https://opennext.js.org/cloudflare)

### 其他免费部署备选

**Render**： [render.com](https://render.com) → New → Web Service → 选仓库，Build 填 `pnpm install && pnpm build`，Start 填 `pnpm start`，Environment 添加 `OPENAI_API_KEY`。

## 项目结构（概要）

```
src/
├── app/
│   ├── api/chat/     # POST 接口，OpenAI 对话
│   ├── ask-ai/       # Ask AI 页面
│   ├── resume/       # 完整简历
│   ├── projects/     # 项目
│   ├── ai-projects/  # AI 项目
│   ├── blog/         # Blog
│   ├── contact/      # 联系
│   ├── layout.tsx
│   └── page.tsx      # 首页
├── components/
│   ├── ui/           # Button, Card, Input
│   └── site-nav.tsx
├── data/
│   └── resume.ts     # 简历数据 + AI System Prompt 生成
└── lib/
    └── utils.ts      # cn()
```
