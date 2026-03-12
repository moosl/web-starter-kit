# Web Starter Kit

A quick-launch web starter kit for building AI-powered websites, running entirely on Cloudflare's free tier. The first template is an **AI image generation app** using Replicate's Flux 1.1 Pro model.

**Tech stack**: SvelteKit 2 + Svelte 5 · Cloudflare Workers + D1 + R2 + KV · Drizzle ORM · Google OAuth · Creem Payments · Replicate AI

## Features

- **AI Image Generation** — Replicate Flux 1.1 Pro with webhook + sync modes
- **Google OAuth Login** — Session-based auth with 30-day TTL
- **Credit System** — Freeze-confirm billing model, free credits on signup
- **Payments** — Creem checkout integration with HMAC-verified webhooks
- **File Upload** — R2 presigned URLs with ownership-verified image proxy
- **Bot Protection** — Cloudflare Turnstile
- **i18n** — 4 languages (en/zh/ja/ko) with URL-prefix routing
- **Alert Emails** — Resend integration with KV rate limiting
- **Feature Flags** — Every subsystem independently toggleable

## Quick Start

```bash
git clone https://github.com/your-username/web-starter-kit.git
cd web-starter-kit
npm install
npm run setup    # copies config files + creates local database
```

`npm run setup` 会自动：
1. 从模板创建 `.dev.vars` 和 `.env` 配置文件
2. 初始化本地 D1 数据库

接下来配置你需要的 API Key（见下方），然后：

```bash
npm run dev      # http://localhost:8787
```

## Prerequisites

- **Node.js** >= 20
- A **Cloudflare** account (free tier, only needed for deploy — local dev works without it)

## Configuring API Keys

运行 `npm run setup` 后，编辑项目根目录的 `.dev.vars` 文件，填入你需要的 key。

**不需要全部配完！** 哪个功能的 key 没配，就在 `src/lib/config.ts` 里把对应的 feature flag 设为 `false` 即可（见 [Feature Flags](#feature-flags)）。

---

### 1. Google OAuth（用户登录）

**需要配置：** `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
**对应 feature flag：** `auth`

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
9. **Authorized redirect URIs** 点 ADD URI，添加：
   - `http://localhost:8787/login/google/callback`（本地开发）
   - `https://your-domain.com/login/google/callback`（生产环境，稍后再加也行）
10. 点 **Create**，复制 **Client ID** 和 **Client Secret**
11. 填入 `.dev.vars`：
    ```
    GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
    ```

---

### 2. Replicate（AI 图片生成）

**需要配置：** `REPLICATE_API_TOKEN`
**对应 feature flag：** `ai`

1. 打开 [replicate.com](https://replicate.com)，注册/登录
2. 点右上角头像 > **API tokens**（或直接访问 [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)）
3. 点 **Create token**，复制生成的 token
4. 填入 `.dev.vars`：
   ```
   REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

> Replicate 新账户有免费额度，够测试用。

---

### 3. Creem（支付）

**需要配置：** `CREEM_API_KEY` + `CREEM_WEBHOOK_SECRET`
**对应 feature flag：** `payments`

1. 打开 [creem.io](https://creem.io)，注册/登录
2. Dashboard 左侧菜单 > **API Keys**
3. 创建一个 API Key，复制
4. 左侧菜单 > **Webhooks** > 添加 Webhook endpoint：
   - URL: `https://your-domain.com/api/webhook/creem`（本地测试需要 ngrok 等隧道工具）
   - Events: 勾选 `checkout.completed`
5. 复制 Webhook signing secret
6. 填入 `.dev.vars`：
   ```
   CREEM_API_KEY=creem_xxxxxxxxxxxxxxxx
   CREEM_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
   ```

> 本地测试支付 webhook 需要公网 URL。可以用 [ngrok](https://ngrok.com) 或 [cloudflared tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)。

---

### 4. Cloudflare Turnstile（人机验证）

**需要配置：** `TURNSTILE_SECRET_KEY`（`.dev.vars`）+ `PUBLIC_TURNSTILE_SITE_KEY`（`.env`）
**对应 feature flag：** `turnstile`

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
**对应 feature flag：** `upload`

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 > **R2 Object Storage**
3. 点 **Create bucket**，名字填 `web-starter-kit-uploads`
4. 回到 R2 概览页，点右上角 **Manage R2 API Tokens**
5. 点 **Create API token**
   - Permissions: **Object Read & Write**
   - Specify bucket: 选 `web-starter-kit-uploads`
6. 创建后复制 **Access Key ID** 和 **Secret Access Key**
7. 找到你的 **Account ID**（Cloudflare Dashboard 右侧栏，或 URL 中的那串 hex）
8. 填入 `.dev.vars`：
   ```
   R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   R2_ENDPOINT=https://你的AccountID.r2.cloudflarestorage.com
   ```

---

### 6. Resend（错误告警邮件）

**需要配置：** `RESEND_API_KEY`
**无 feature flag**（可选功能，没配就不发邮件）

1. 打开 [resend.com](https://resend.com)，注册/登录
2. 左侧菜单 > **API Keys**
3. 点 **Create API Key**，权限选 **Sending access**
4. 复制 key，填入 `.dev.vars`：
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

> 还需要在 `src/lib/config.ts` 的 `alert.email` 填入接收告警的邮箱地址。

---

### Key 配置速查表

| Feature | 需要的 Key | Feature Flag | 必须配？ |
|---|---|---|---|
| 用户登录 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `auth` | 推荐 |
| AI 生图 | `REPLICATE_API_TOKEN` | `ai` | 核心功能 |
| 支付 | `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET` | `payments` | 可后配 |
| 人机验证 | `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY` | `turnstile` | 可后配 |
| 文件上传 | `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` | `upload` | 可后配 |
| 积分系统 | 无需 key | `credits` | 无需 key |
| 告警邮件 | `RESEND_API_KEY` | 无（可选） | 可不配 |

## Feature Flags

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

## Project Structure

```
src/
├── hooks.server.ts          # Auth → i18n → route protection → security headers
├── lib/
│   ├── config.ts            # Feature flags and app settings
│   ├── i18n/
│   │   └── messages/        # en.ts, zh.ts, ja.ts, ko.ts
│   └── server/
│       ├── ai/              # AI provider factory (Replicate)
│       ├── auth/            # Session management, Google OAuth
│       ├── db/              # Drizzle ORM schema + connection factory
│       └── alert.ts         # Error alert emails via Resend
├── routes/
│   ├── [lang]/              # Public pages (landing, pricing, privacy, terms)
│   │   └── app/             # Authenticated area (generate, gallery, account, billing)
│   ├── login/google/        # OAuth initiation + callback
│   └── api/                 # REST endpoints
│       ├── generate/        # Generation status polling
│       ├── upload/          # Presigned R2 upload URLs
│       ├── image/           # R2 image proxy
│       ├── checkout/        # Creem checkout session
│       └── webhook/         # Creem + Replicate webhooks
├── migrations/              # D1 SQL migrations
└── scripts/
    └── setup.sh             # One-time local setup script
```

## Commands

| Command | What it does |
|---|---|
| `npm run setup` | One-time local setup (config files + DB migration) |
| `npm run deploy` | One-command production deploy (resources + secrets + deploy) |
| `npm run dev` | Start local dev server on port 8787 |
| `npm run build` | Production build |
| `npm run check` | TypeScript + Svelte type checking |
| `npm test` | Run all unit tests (65 tests) |
| `npm run test:watch` | Tests in watch mode |
| `npm run db:generate` | Generate migration from schema changes |
| `npm run db:migrate:local` | Apply migrations to local D1 |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |

## Deploying to Production

```bash
npm run deploy
```

One command handles everything:
1. Logs in to Cloudflare (if not already)
2. Creates D1 database, R2 bucket, KV namespace (skips if they exist)
3. Auto-updates `wrangler.toml` with resource IDs
4. Prompts for each secret (press Enter to skip any)
5. Migrates remote database
6. Deploys to Cloudflare Workers

### CI/CD (optional)

The repo includes `.github/workflows/deploy.yml` — auto-deploys on push to `main`.

1. Go to GitHub repo **Settings > Secrets > Actions**
2. Add `CLOUDFLARE_API_TOKEN` ([create one here](https://dash.cloudflare.com/profile/api-tokens) using "Edit Cloudflare Workers" template)
3. Push to `main`

### Custom Domain

1. Cloudflare Dashboard > **Workers & Pages** > your worker > **Settings > Domains**
2. Add your domain (must be on Cloudflare DNS)
3. Update Google OAuth redirect URI to match

## Troubleshooting

**`npm run dev` fails with "D1 database not found"**
→ Run `npm run setup` first, or `npm run db:migrate:local` to create the local database.

**OAuth redirect fails**
→ Check Google Cloud Console redirect URI matches exactly: `http://localhost:8787/login/google/callback`

**"Missing binding" errors in production**
→ All 3 bindings (DB, R2, KV) must have valid IDs in `wrangler.toml`.

**Type errors after schema changes**
→ `npm run db:generate` then `npm run db:migrate:local`

## License

MIT
