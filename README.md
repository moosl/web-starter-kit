# Web Starter Kit

快速启动的 Web 开发模板，用于构建 AI 驱动的网站，完全运行在 Cloudflare 免费套餐上。第一个模板是基于 Replicate Flux 1.1 Pro 模型的 **AI 图片生成应用**。

**技术栈**：SvelteKit 2 + Svelte 5 · Cloudflare Workers + D1 + R2 + KV · Drizzle ORM · Google OAuth · Creem 支付 · Replicate AI

## 功能特性

- **AI 图片生成** — Replicate Flux 1.1 Pro，支持 webhook + 同步模式（内置 mock 模式，无需 API key 即可测试）
- **Google OAuth 登录** — 基于 Session 的认证，30 天有效期
- **积分系统** — 冻结-确认扣费模型，注册赠送免费积分
- **支付** — Creem 结账集成，HMAC 签名验证 webhook
- **文件上传** — R2 服务端代理上传，带所有权验证的图片代理
- **人机验证** — Cloudflare Turnstile
- **国际化** — 4 种语言（en/zh/ja/ko），URL 前缀路由
- **告警邮件** — Resend 集成，KV 限速
- **功能开关** — 每个子系统可独立启用/禁用

## 快速开始

```bash
git clone https://github.com/your-username/web-starter-kit.git
cd web-starter-kit
npm install
npm run setup    # 复制配置文件 + 创建本地数据库
```

`npm run setup` 会自动：
1. 从模板创建 `.dev.vars` 和 `.env` 配置文件
2. 初始化本地 D1 数据库

接下来配置你需要的 API Key（见下方），然后：

```bash
npm run dev      # http://localhost:5173
```

## 前置要求

- **Node.js** >= 20
- **Cloudflare** 账号（免费套餐，仅部署时需要 — 本地开发无需）

## 配置 API Key

运行 `npm run setup` 后，编辑项目根目录的 `.dev.vars` 文件，填入你需要的 key。

**不需要全部配完！** 哪个功能的 key 没配，就在 `src/lib/config.ts` 里把对应的功能开关设为 `false` 即可（见 [功能开关](#功能开关)）。

---

### 1. Google OAuth（用户登录）

**需要配置：** `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
**对应功能开关：** `auth`

1. 打开 [Google Cloud Console](https://console.cloud.google.com)
2. 创建项目（或选择已有项目）
3. 左侧菜单 **APIs & Services** > **Credentials**
4. 点击顶部 **+ CREATE CREDENTIALS** > **OAuth client ID**
5. 如果提示配置 OAuth consent screen：
   - User Type 选 **External**，点 Create
   - 填写 App name、User support email、Developer email，其余跳过
   - Scopes 页面直接 Save and Continue
   - Test users 添加你自己的 Gmail，Save and Continue
6. 回到 Credentials 页面，再次点 **+ CREATE CREDENTIALS** > **OAuth client ID**
7. Application type 选 **Web application**
8. Name 随意填（如 `web-starter-kit`）
9. **Authorized JavaScript origins** 点 ADD URI，添加：
   - `http://localhost:5173`（本地开发）
   - `https://your-domain.com`（生产环境，稍后再加也行）
10. **Authorized redirect URIs** 点 ADD URI，添加：
    - `http://localhost:5173/login/google/callback`（本地开发）
    - `https://your-domain.com/login/google/callback`（生产环境，稍后再加也行）
11. 点 **Create**，复制 **Client ID** 和 **Client Secret**
12. 填入 `.dev.vars`：
    ```
    GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
    ```
13. 把同样的 Client ID 填入 `.env`（用于浏览器端 One Tap 登录）：
    ```
    PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
    ```

---

### 2. Replicate（AI 图片生成）

**需要配置：** `REPLICATE_API_TOKEN`
**对应功能开关：** `ai`

1. 打开 [replicate.com](https://replicate.com)，注册/登录
2. 点右上角头像 > **API tokens**（或直接访问 [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)）
3. 点 **Create token**，复制生成的 token
4. 填入 `.dev.vars`：
   ```
   REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

> Replicate 新账户有免费额度，够测试用。

**不想接入 Replicate？** 在 `src/lib/config.ts` 中把 `ai.provider` 改为 `'mock'`，会返回占位图，无需 API key，适合测试积分扣除等流程。

---

### 3. Creem（支付）

**需要配置：** `CREEM_API_KEY` + `CREEM_WEBHOOK_SECRET`
**对应功能开关：** `payments`

1. 打开 [creem.io](https://creem.io)，注册/登录
2. Dashboard 左侧菜单 > **API Keys**
3. 创建一个 API Key，复制
4. 左侧菜单 > **Products** > 创建 Starter 和 Pro 两个产品，复制各自的 Product ID
5. 把 Product ID 填入 `src/lib/config.ts` 的 `plans.starter.creemProductId` 和 `plans.pro.creemProductId`
6. 左侧菜单 > **Webhooks** > 添加 Webhook endpoint：
   - URL: `https://your-domain.com/api/webhook/creem`（本地测试需要 ngrok 等隧道工具）
   - Events: 勾选 `checkout.completed`
7. 复制 Webhook signing secret
8. 填入 `.dev.vars`：
   ```
   CREEM_API_KEY=creem_xxxxxxxxxxxxxxxx
   CREEM_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
   ```

> 本地测试支付 webhook 需要公网 URL。可以用 [ngrok](https://ngrok.com) 或 [cloudflared tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)。

---

### 4. Cloudflare Turnstile（人机验证）

**需要配置：** `TURNSTILE_SECRET_KEY`（`.dev.vars`）+ `PUBLIC_TURNSTILE_SITE_KEY`（`.env`）
**对应功能开关：** `turnstile`

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 > **Turnstile**
3. 点 **Add site**
4. Site name 随意，Domain 填 `localhost`（开发）和你的生产域名
5. Widget Mode 选 **Managed**
6. 创建后你会看到 **Site Key** 和 **Secret Key**
7. 填入对应文件：
   ```
   # .dev.vars
   TURNSTILE_SECRET_KEY=0x4AAAAAAAxxxxxxxxxxxxxxxx

   # .env
   PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAAxxxxxxxxxxxxxxxx
   ```

---

### 5. R2 + Presigned Upload（文件上传）

**需要配置：** `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` + `R2_ENDPOINT`
**对应功能开关：** `upload`

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 > **R2 Object Storage**
3. 点 **Create bucket**，名字填 `web-starter-kit-uploads`
4. 回到 R2 概览页，右侧 Account Details 下点 **API Tokens**
5. 选择 **Account API Tokens**（推荐），点 **Create API token**
   - Token name: 随意填（如 `web-starter-kit`）
   - Permissions: **Object Read & Write**
   - Applied to: 选 `web-starter-kit-uploads`
6. 创建后复制 **Access Key ID** 和 **Secret Access Key**
7. **R2_ENDPOINT** 在 R2 概览页右侧 Account Details > **S3 API** 处可以找到，格式为 `https://你的AccountID.r2.cloudflarestorage.com`
8. 填入 `.dev.vars`：
   ```
   R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   R2_ENDPOINT=https://你的AccountID.r2.cloudflarestorage.com
   ```

---

### 6. Resend（错误告警邮件）

**需要配置：** `RESEND_API_KEY` + `ALERT_EMAIL`
**无功能开关**（可选功能，没配就不发邮件）

1. 打开 [resend.com](https://resend.com)，注册/登录
2. 左侧菜单 > **API Keys**
3. 点 **Create API Key**，权限选 **Sending access**
4. 复制 key，填入 `.dev.vars`：
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   ALERT_EMAIL=your-email@example.com
   ```

---

### 配置速查表

| 功能 | 需要的 Key | 功能开关 | 必须配？ |
|---|---|---|---|
| 用户登录 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PUBLIC_GOOGLE_CLIENT_ID`（`.env`） | `auth` | 推荐 |
| AI 生图 | `REPLICATE_API_TOKEN` | `ai` | 核心功能 |
| 支付 | `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET` + Product ID 在 config.ts | `payments` | 可后配 |
| 人机验证 | `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY` | `turnstile` | 可后配 |
| 文件上传 | `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` | `upload` | 可后配 |
| 积分系统 | 无需 key | `credits` | 无需 key |
| 告警邮件 | `RESEND_API_KEY`, `ALERT_EMAIL` | 无（可选） | 可不配 |

## 功能开关

没配齐 key？编辑 `src/lib/config.ts`，把对应功能关掉：

```ts
export const config = {
  features: {
    auth: true,        // 用户登录     — 需要 GOOGLE_CLIENT_ID/SECRET
    payments: false,   // 支付         — 需要 CREEM_API_KEY
    credits: false,    // 积分系统     — 无需 key
    ai: false,         // AI 生图      — 需要 REPLICATE_API_TOKEN
    turnstile: false,  // 人机验证     — 需要 TURNSTILE_SECRET_KEY
    upload: false,     // 文件上传     — 需要 R2_* keys
  },
  // ...
};
```

设为 `false` 后，对应的路由和 hooks 自动跳过，不会因为缺 key 报错。

## 项目结构

```
src/
├── hooks.server.ts          # 认证 → 国际化 → 路由保护 → 安全头
├── lib/
│   ├── config.ts            # 功能开关和应用配置
│   ├── i18n/
│   │   └── messages/        # en.ts, zh.ts, ja.ts, ko.ts
│   └── server/
│       ├── ai/              # AI 提供商工厂（Replicate / Mock）
│       ├── auth/            # Session 管理、Google OAuth
│       ├── db/              # Drizzle ORM 数据库模型 + 连接工厂
│       └── alert.ts         # 通过 Resend 发送错误告警邮件
├── routes/
│   ├── [lang]/              # 公开页面（首页、定价、隐私政策、服务条款）
│   │   └── app/             # 需登录区域（生成、画廊、账户、账单）
│   ├── login/google/        # OAuth 发起 + 回调
│   └── api/                 # REST 接口
│       ├── generate/        # 生成状态轮询
│       ├── upload/          # R2 服务端代理上传
│       ├── image/           # R2 图片代理
│       ├── checkout/        # Creem 结账会话
│       └── webhook/         # Creem + Replicate webhook
├── migrations/              # D1 SQL 迁移文件
└── scripts/
    └── setup.sh             # 一次性本地初始化脚本
```

## 常用命令

| 命令 | 说明 |
|---|---|
| `npm run setup` | 一次性本地初始化（配置文件 + 数据库迁移） |
| `npm run deploy` | 一键生产部署（创建资源 + 设置密钥 + 部署） |
| `npm run dev` | 启动本地开发服务器（端口 5173） |
| `npm run build` | 生产构建 |
| `npm run check` | TypeScript + Svelte 类型检查 |
| `npm test` | 运行全部单元测试（65 个） |
| `npm run test:watch` | 监听模式运行测试 |
| `npm run db:generate` | 根据 schema 变更生成迁移文件 |
| `npm run db:migrate:local` | 将迁移应用到本地 D1 |
| `npm run db:studio` | 打开 Drizzle Studio（可视化数据库浏览器） |

## 部署到生产环境

```bash
npm run deploy
```

一条命令搞定一切：
1. 从 `.dev.vars` 读取 `APP_NAME`（默认：`web-starter-kit`）
2. 登录 Cloudflare（如果尚未登录）
3. 根据 `APP_NAME` 更新 `wrangler.toml` 中的资源名
4. 创建 D1 数据库、R2 存储桶、KV 命名空间（已存在则跳过）
5. 自动将资源 ID 写入 `wrangler.toml`
6. 从 `.dev.vars` 读取密钥并自动设置（空值跳过）
7. 迁移远程数据库
8. 部署到 Cloudflare Workers

### 部署多个副本

要在同一个 Cloudflare 账号下部署多个副本，只需在 `.dev.vars` 中设置不同的 `APP_NAME`：

```bash
APP_NAME=my-app
```

部署脚本会自动派生所有资源名：

| 资源 | 命名规则 | 示例 |
|---|---|---|
| Worker | `APP_NAME` | `my-app` |
| D1 数据库 | `APP_NAME-db` | `my-app-db` |
| R2 存储桶 | `APP_NAME-uploads` | `my-app-uploads` |

不设置则默认使用 `web-starter-kit`。

### CI/CD（可选）

项目包含 `.github/workflows/deploy.yml` — 推送到 `main` 分支自动部署。

#### 获取 `CLOUDFLARE_API_TOKEN`

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com)，点右上角头像 > **My Profile**
2. 左侧菜单 > **API Tokens**
3. 点 **Create Token**
4. 找到 **Edit Cloudflare Workers** 模板，点右侧 **Use template**
5. 默认权限已包含 Workers、D1、R2、KV 的读写权限，无需修改
6. Account Resources 选你的账户，Zone Resources 可选 All zones 或指定域名
7. 点 **Continue to summary** > **Create Token**
8. 复制生成的 token（只显示一次！）

#### 配置 GitHub Actions

1. 打开你的 GitHub 仓库 > **Settings** > **Secrets and variables** > **Actions**
2. 点 **New repository secret**
3. Name 填 `CLOUDFLARE_API_TOKEN`，Value 粘贴刚才复制的 token
4. 点 **Add secret**
5. 推送到 `main` 分支即可自动部署

### 自定义域名

1. Cloudflare Dashboard > **Workers & Pages** > 你的 Worker > **Settings > Domains**
2. 添加你的域名（必须使用 Cloudflare DNS）
3. 同步更新 Google OAuth 的重定向 URI

## 常见问题

**`npm run dev` 报错 "D1 database not found"**
→ 先运行 `npm run setup`，或执行 `npm run db:migrate:local` 创建本地数据库。

**OAuth 重定向失败**
→ 检查 Google Cloud Console 中的重定向 URI 是否完全匹配：`http://localhost:5173/login/google/callback`

**生产环境报 "Missing binding" 错误**
→ `wrangler.toml` 中的 3 个绑定（DB、R2、KV）必须有有效的 ID。

**修改 schema 后出现类型错误**
→ 先执行 `npm run db:generate`，再执行 `npm run db:migrate:local`

## 许可证

MIT
