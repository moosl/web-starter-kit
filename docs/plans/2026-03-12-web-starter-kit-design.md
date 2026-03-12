# Web Starter Kit Design

> SvelteKit + Cloudflare 全家桶，开箱即用的快速上站脚手架

## 技术栈

| 层 | 方案 |
|---|------|
| 框架 | SvelteKit → Cloudflare Pages |
| 数据库 | Cloudflare D1 (SQLite) + Drizzle ORM |
| 文件存储 | Cloudflare R2 |
| 认证 | Lucia Auth + Google OAuth |
| 支付 | Creem（额度购买/订阅） |
| AI 服务 | 可插拔接口，默认 Replicate |
| 防机器人 | Cloudflare Turnstile |
| 统计 | Cloudflare Web Analytics + Google Analytics (GA4) |
| 异常告警 | Resend（邮件告警，免费 100 封/天） |
| 多语言 | URL 前缀路由 (`/en/`, `/zh/`) |

所有服务使用 Cloudflare 免费额度：Pages 无限站点、Workers 10 万请求/天、D1 5GB、R2 10GB、Turnstile 无限。唯一外部费用是 AI 生图服务（Replicate 按次计费）。

> **扩展备注：** D1 是 SQLite 单写入者模型，免费额度阶段足够。如果后续并发写入量大，可考虑迁移到 Turso。

## 功能开关系统

所有功能模块可独立开关，关掉后对应的路由、UI 入口、后端逻辑自动禁用：

```typescript
// lib/config.ts
export const config = {
  features: {
    auth: true,        // 关掉 → 无登录，所有人可用
    payments: true,    // 关掉 → 无支付，无定价页
    credits: true,     // 关掉 → 不扣积分，无限使用
    ai: true,          // 关掉 → 生图入口隐藏，变成纯模板
    turnstile: true,   // 关掉 → 不验证机器人
    upload: true,      // 关掉 → 不支持图生图
  },
  ai: {
    provider: 'replicate',
    defaultModel: 'flux-1.1-pro',
  },
  credits: {
    costPerGeneration: 1,
    freeOnSignup: 10,
  },
  upload: {
    maxSizeMB: 10,
    allowedTypes: ['jpg', 'png', 'webp'],
  },
  alert: {
    email: '',                    // 告警收件邮箱，空则不启用
    maxPerHour: 10,               // 每小时最多发送告警数，防异常风暴刷爆邮箱
  },
  analytics: {
    cloudflareWebAnalytics: '',  // CF beacon token，空则不启用
    googleAnalytics: '',          // GA4 measurement ID，空则不启用
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'ja', 'ko'],
  },
}
```

## 页面结构

```
/[lang]/ .................. 落地页（介绍 + 登录入口）
/[lang]/pricing ........... 定价页
/[lang]/privacy ........... 隐私政策
/[lang]/terms ............. 服务条款
/login .................... Google 登录
/login/google/callback .... OAuth 回调
/[lang]/app ............... 生图主页面（输入 prompt / 上传参考图 → 生成）
/[lang]/app/gallery ....... 个人图片历史
/[lang]/app/account ....... 个人中心（额度、订阅、账户信息、同步订单状态）
/[lang]/app/billing ....... 支付结果页
/api/generate ............. 生图 API
/api/upload ............... 上传参考图 API
/api/webhook/creem ........ Creem 支付回调
/api/webhook/replicate .... AI 生图回调（webhook 模式）
```

- 无前缀请求（如 `/pricing`）根据浏览器 `Accept-Language` 自动 301 重定向到对应语言
- 每个页面 `<head>` 输出 `<link rel="alternate" hreflang="..." />` 标签，包含 `hreflang="x-default"` 指向英文版
- `sitemap.xml` 包含所有语言版本的 URL（排除 `/app/*` 路径，需登录的页面不索引）

## 数据库设计（D1）

七张表：

```sql
-- 用户表
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE,
  name          TEXT,
  avatar_url    TEXT,
  credits       INTEGER DEFAULT 0,
  plan          TEXT DEFAULT 'free',
  created_at    INTEGER NOT NULL,
  deleted_at    INTEGER              -- 软删除，合规需要
);

-- Session 表（Lucia）
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);

-- OAuth 账号（支持多登录方式）
CREATE TABLE oauth_accounts (
  provider_id      TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  user_id          TEXT NOT NULL REFERENCES users(id),
  PRIMARY KEY (provider_id, provider_user_id)
);

-- 生图记录
CREATE TABLE generations (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  prompt        TEXT NOT NULL,
  ref_image_url TEXT,
  result_url    TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  failure_reason TEXT,                -- 失败原因（timeout / api_error / etc）
  provider      TEXT,
  model         TEXT,
  credits_used  INTEGER DEFAULT 1,
  created_at    INTEGER NOT NULL,
  deleted_at    INTEGER              -- 软删除
);

-- 积分流水
CREATE TABLE credit_logs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  amount      INTEGER NOT NULL,
  balance     INTEGER NOT NULL,
  type        TEXT NOT NULL,
  ref_id      TEXT,
  created_at  INTEGER NOT NULL
);

-- 支付记录
CREATE TABLE payments (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  creem_order_id  TEXT UNIQUE,
  type            TEXT NOT NULL,
  amount          INTEGER NOT NULL,
  currency        TEXT NOT NULL,
  credits_added   INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      INTEGER NOT NULL
);
-- 错误日志（轻量监控，替代 Sentry）
CREATE TABLE error_logs (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,          -- unhandled / api_error / webhook_fail
  message     TEXT NOT NULL,
  url         TEXT,
  created_at  INTEGER NOT NULL
);
```

设计说明：
- `users.credits` 作为余额缓存，扣减用 `UPDATE ... SET credits = credits - ? WHERE credits >= ? RETURNING credits` 保证原子性，由数据库做并发裁判，不在应用层检查余额
- `credit_logs.balance` 记录变动后余额，方便对账
- `credit_logs.type`: purchase / freeze / consume / unfreeze / gift
- `credit_logs.ref_id`: 关联 generation_id 或 payment_id
- `generations.status`: pending / processing / done / failed（用 `failure_reason` 区分失败原因：timeout / api_error 等）
- `payments.status`: pending / paid / failed / refunded
- 时间全用 INTEGER (unix timestamp)
- `oauth_accounts` 解耦登录方式，未来加 GitHub/微信只需加记录
- `users` 和 `generations` 表有 `deleted_at` 字段，支持软删除，合规需要（支付关联数据不可硬删）

> **软删除性能备注：** 所有查询需加 `WHERE deleted_at IS NULL`。当前数据量无需优化，数据量上来后可加复合索引 `(user_id, deleted_at)` 在 generations 表上。

### 索引

```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_credit_logs_user_id ON credit_logs(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
```

## R2 文件存储

一个 bucket，按路径区分：

```
web-starter-kit-files/
  uploads/{user_id}/{uuid}.{ext}      -- 用户上传的参考图
  generations/{user_id}/{uuid}.png     -- AI 生成的结果图
```

### 上传流程（参考图）

1. 前端请求 `/api/upload`，后端生成 `{uuid, user_id, file_key}` 存入 KV（TTL 5 分钟），返回 R2 presigned PUT URL
2. **前端校验**：上传前检查 `file.size <= 10MB` 和文件类型（仅 jpg/png/webp），拒绝不合规文件
3. 前端通过 presigned PUT URL 直传 R2（不经过 Worker，省带宽和执行时间）
4. 上传完成后前端把 R2 key 回传给后端，后端校验：
   - KV 中该 key 确实分配给当前用户
   - 通过 R2 API 读取文件 `size` 元数据，超过 10MB 则删除文件并拒绝
   - 校验文件头 magic bytes 确认是图片

> **注意：** R2 不支持 Presigned POST，无法在签名中通过 `content-length-range` 做硬性大小限制。因此前端校验 + 后端兜底双重保障。

### 生成结果存储

1. AI 服务返回图片临时 URL
2. Worker 下载图片存到 R2，写入 `generations.result_url`
3. 前端始终从 R2 读取，不依赖外部临时链接

### 访问控制

- R2 **不开启 public access**，所有图片通过 Worker 代理访问（`/api/image/{key}`）
- 前端请求图片时，Worker 校验 session，确认请求者是图片所有者后返回图片
- Worker 响应加 `Cache-Control: private, max-age=3600`，让浏览器缓存 1 小时，Gallery 翻页时同一张图不重复打 Worker
- 避免图片 URL 直接暴露在 HTML 中被无意分享泄露

### 图片加载优化

- Gallery 页面使用 `<img loading="lazy" decoding="async">`，避免一次性加载大量原图
- Worker 代理支持 `?w=300` 参数，通过 Cloudflare Image Resizing 或 wsrv.nl 返回缩略图
- 用户点击缩略图时才加载 R2 原图

### 垃圾回收

- 用户注销时，将对应 R2 路径文件移到 `trash/{user_id}/`
- R2 Bucket 配置 Object Lifecycle Rules，`trash/` 目录下文件 30 天后自动物理删除
- 防止已注销用户的图片永久占据存储空间

### 限制

- 上传文件大小：10MB
- 允许类型：jpg / png / webp

## AI 服务可插拔设计

```typescript
// lib/ai/types.ts
interface AIProvider {
  supportsWebhook: boolean       // 是否支持 webhook 回调
  generate(params: {
    prompt: string
    refImageUrl?: string
    model?: string
    webhookUrl?: string          // 支持 webhook 时传入回调地址
  }): Promise<{
    imageUrl: string             // 同步模式返回图片 URL；webhook 模式返回空
    predictionId: string         // 用于轮询或 webhook 关联
    model: string
    provider: string
  }>
}
```

- 默认实现：`lib/ai/providers/replicate.ts`
- 切换服务只改 `lib/ai/index.ts` 的导出
- `generations` 表记录 `provider` 和 `model`，方便对比

### 两种生图模式

| 模式 | 条件 | 流程 |
|------|------|------|
| **Webhook 异步** | `provider.supportsWebhook === true` | 发请求时带 webhook URL → 立即返回 → `/api/webhook/replicate` 接收结果 |
| **同步 + waitUntil** | `provider.supportsWebhook === false` | 同步 await 等待结果 → 用 `event.waitUntil()` 确保断连后仍完成存储和状态更新 |

> **关于 Worker 超时：** Cloudflare Workers 的 wall-clock 时间没有硬性限制（CPU 时间限制免费版 10ms，付费版 30s 起）。等待外部 API 是 I/O 等待，不消耗 CPU 时间，所以同步等待 10-30 秒不会被 kill。唯一风险是用户断连导致 Worker 取消，用 `waitUntil()` 兜底。

### 生图完整流程（冻结→确认模式）

1. 用户提交 prompt（+ 可选参考图）
2. **冻结积分（数据库做裁判）**：直接执行 `UPDATE users SET credits = credits - ? WHERE id = ? AND credits >= ? RETURNING credits`，返回空则余额不足，拒绝请求（402）。不在应用层做 `if (credits >= cost)` 检查，避免并发 race condition
3. 冻结成功后写 `credit_logs`（type: freeze, amount: -1），写入 `generations`（status: pending）
4. 调用 `ai.generate()`（失败自动重试一次，间隔 2 秒）
5. 成功 → 下载图片存 R2，更新 `generations`（status: done），写 `credit_logs`（type: consume, amount: 0，确认消费）
6. 失败/超时 → 更新 status: failed + failure_reason，**解冻积分**：`credits + 1`，写 `credit_logs`（type: unfreeze, amount: +1）

用户永远不会出现"积分没了图也没出来"的情况。

生图耗时 10-30 秒，前端用指数退避轮询（前 3 次间隔 1 秒，之后 3 秒，再之后 5 秒），不引入 WebSocket。前端生成按钮点击后立即 disable + 显示 loading（乐观 UI），防止连点导致 D1 写入队列延迟。

### 僵尸订单清理（Cron Trigger）

在 `wrangler.toml` 中配置定时任务（`[triggers] crons = ["*/15 * * * *"]`），每 15 分钟扫描：

- `generations` 表中超过 1 小时仍处于 `pending` 状态的记录
- 将其标记为 `failed`（failure_reason: timeout）
- 回滚冻结的积分，写 `credit_logs`（type: unfreeze, amount: +1）

防止任何异常情况导致积分被永久锁死。

## 认证

### Google 登录流程

1. 点击「Google 登录」→ 跳转 Google OAuth
2. 回调到 `/login/google/callback`
3. 查 `oauth_accounts` → 有则登录，无则创建 users + oauth_accounts 记录
4. Lucia 创建 session，写入 cookie
5. 跳转 `/[lang]/app`

### 路由保护

- `/[lang]/app/*` 在 `hooks.server.ts` 统一校验 session（auth 功能开启时）
- 未登录 → 重定向 `/login`
- 落地页、定价页、法律页不需要登录

### Session KV 缓存

为节省 D1 读取配额（每次路由跳转都会查 session），增加 KV 缓存层：

1. 登录成功时，Session 同时写入 D1 和 KV（TTL 与 session 过期时间一致）
2. `hooks.server.ts` 优先查 KV，命中则直接放行
3. KV 未命中再查 D1，查到后回写 KV
4. 用户登出或被封禁时，同时删除 KV 和 D1 中的 session

## 支付

### Creem 支付流程

1. 用户在 `/[lang]/pricing` 选择套餐
2. 前端调 `/api/checkout` → 创建 Creem 订单，返回支付链接
3. 用户跳转 Creem 完成支付
4. Creem 通过 `/api/webhook/creem` 回调通知
5. Webhook 校验签名 → 更新 `payments`（status: paid）→ 增加 `users.credits` → 写 `credit_logs`（type: purchase）
6. 用户跳回 `/[lang]/app/billing?status=success`

### 关键细节

- Webhook 幂等处理：`creem_order_id` 的 UNIQUE 约束防重复加积分
- 积分变动走事务：`UPDATE users` + `INSERT credit_logs` 在同一个 D1 batch
- Webhook 容错：`/[lang]/app/account` 提供「同步订单状态」按钮，后端主动调 Creem API 查询订单状态，防止 webhook 丢失或延迟导致用户付了钱但积分没到账

## 安全与防护

### Turnstile

- 加在登录页和生图提交
- 前端嵌入 widget，后端校验 token

### Cloudflare 自带能力（Dashboard 配置）

- Rate Limiting：`/api/generate` 每分钟 10 次/IP
- WAF：自动防 SQL 注入、XSS
- DDoS Protection：默认开启
- Bot Management：Free plan 基础 bot 检测

### 安全响应头

在 `hooks.server.ts` 的 `handle` 中统一注入安全响应头：

```typescript
// hooks.server.ts handle 函数中
response.headers.set('X-Frame-Options', 'DENY')
response.headers.set('X-Content-Type-Options', 'nosniff')
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' https://*.google-analytics.com")
```

涉及支付和认证，这些头防点击劫持、MIME 嗅探、信息泄露，过合规扫描时也省心。

### 应用层补充

- 用户级限流：每用户每分钟 5 次生图，查 `generations` 表最近 1 分钟记录数

## 多语言 (i18n)

### 文案管理

```
lib/i18n/messages/
  en.ts    -- 英文
  zh.ts    -- 中文
  ja.ts    -- 日文
  ko.ts    -- 韩文
```

- 所有文案集中管理，一个语言一个文件
- 组件里用 `t('landing.title')` 调用
- SEO 的 title / description 也走这套

### SEO

- 每个页面 `<head>` 输出 `<link rel="alternate" hreflang="en" href="/en/..." />`，加 `hreflang="x-default"` 指向英文版（Googlebot 不发 Accept-Language，确保默认走英文）
- 自动生成 `sitemap.xml` 包含所有语言版本（排除 `/app/*`）
- 统一 `<SEO>` 组件，从 config 或页面 data 读取 title / description / og:image

### 类型安全与翻译工作流

- 英文 `en.ts` 为 source of truth，导出类型定义
- 其他语言文件用 `satisfies typeof en` 强制匹配 key 结构，缺失 key 在编译期报错
- 翻译内容可用 AI 批量翻译后人工校对

## 开发体验

- `wrangler.toml` — D1、R2、KV 绑定声明（不填 resource ID），含 Cron Trigger 配置
- Toast 通知组件 — 内置轻量 toast，生图/支付/上传等场景复用

### 环境变量管理

三层分离，避免混淆：

| 文件 | 用途 | 提交到 Git |
|------|------|-----------|
| `.env` | 前端公开配置（`PUBLIC_` 前缀，如 `PUBLIC_TURNSTILE_SITE_KEY`） | `.env.example` 提交，`.env` 不提交 |
| `.dev.vars` | 后端机密（`GOOGLE_CLIENT_SECRET`、`CREEM_API_KEY`、`REPLICATE_API_TOKEN`、`RESEND_API_KEY` 等），Miniflare 本地开发读取 | 不提交 |
| Cloudflare Secrets | 线上部署的后端机密，通过 `wrangler secret put <KEY>` 注入 | — |

项目提供 `.env.example` 和 `.dev.vars.example` 两个模板文件。

### 本地开发

- `wrangler dev` 自动用 Miniflare 模拟 D1/R2/KV，无需远程资源
- 后端机密从 `.dev.vars` 读取（非 `.env`，这是 SvelteKit + Cloudflare 的常见坑）

### Drizzle ORM

集成 Drizzle ORM 作为数据库操作层，替代手写 SQL 字符串：

**为什么选 Drizzle：**
- 目前 Serverless/Edge 生态（特别是 Cloudflare D1）支持最好的 TypeScript ORM
- 绝对类型安全：表名、字段名编辑器自动补全，拼错编译期报错
- `drizzle-kit generate` 自动从 TS schema 生成 migration 文件，配合 `wrangler d1 migrations apply`
- `drizzle-kit studio` 本地可视化管理 Miniflare D1 数据库

```typescript
// lib/db/schema.ts — Drizzle schema 定义（source of truth）
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  credits: integer('credits').default(0),
  plan: text('plan').default('free'),
  createdAt: integer('created_at').notNull(),
  deletedAt: integer('deleted_at'),
})
// ... 其余表同理
```

```typescript
// 类型安全的查询示例
import { eq, sql } from 'drizzle-orm'
import { users } from './schema'

// "数据库做裁判"的并发安全扣减，用 Drizzle 的 sql 模板
const result = await db.update(users)
  .set({ credits: sql`credits - ${cost}` })
  .where(and(eq(users.id, userId), sql`credits >= ${cost}`))
  .returning({ credits: users.credits })
```

### 数据库版本管理（Drizzle + D1 Migrations）

Schema 变更工作流：

```bash
# 1. 修改 lib/db/schema.ts
# 2. 自动生成 migration 文件
npx drizzle-kit generate

# 3. 应用迁移
wrangler d1 migrations apply DB --local   # 本地
wrangler d1 migrations apply DB --remote  # 线上

# 本地可视化调试
npx drizzle-kit studio
```

初始 migration 由 `drizzle-kit generate` 从 schema.ts 自动生成，存放于 `migrations/` 目录。

### Cloudflare 资源自动化（Wrangler 4.45.0+）

所有 Cloudflare 资源**全自动创建**，不需要手动到 Dashboard 配：

```toml
# wrangler.toml - 只声明绑定，不填 ID
[[d1_databases]]
binding = "DB"

[[r2_buckets]]
binding = "R2"

[[kv_namespaces]]
binding = "KV"

[triggers]
crons = ["*/15 * * * *"]
```

部署流程：

```bash
# 一键初始化（包装了 wrangler deploy + d1 execute）
npm run setup
```

`npm run setup` 内部执行：
1. `wrangler deploy` — 自动创建 D1/R2/KV 并绑定，资源 ID 自动回写 wrangler.toml
2. `wrangler d1 migrations apply DB --remote` — 应用所有迁移文件

> **唯一需要手动配的：** Cloudflare Dashboard 中的 Rate Limiting 规则（WAF 层面），无法通过 wrangler.toml 声明。

## 全局错误兜底

### +error.svelte

预置美观的错误页面（`src/routes/+error.svelte`），展示友好的错误信息而非白屏或裸 stack trace。支持多语言，根据状态码区分显示（404 / 500 / 其他）。

### handleError

在 `hooks.server.ts` 导出 `handleError` 函数，集中捕获所有未被 catch 的后端异常：

```typescript
// hooks.server.ts
export const handleError: HandleServerError = ({ error, event }) => {
  console.error('Unhandled error:', error)
  // 关键错误写入 D1 error_logs，方便回溯（Worker 的 console.log 不方便查）
  event.platform?.context.waitUntil(
    event.platform?.env.DB.prepare(
      'INSERT INTO error_logs (id, type, message, url, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(crypto.randomUUID(), 'unhandled', String(error), event.url.pathname, Date.now()).run()
  )
  // 返回安全的错误信息，不暴露 stack trace
  return {
    message: 'Something went wrong',
    code: 'INTERNAL_ERROR',
  }
}
```

在 Worker 环境下，外部 API 超时、D1 连接波动是常态，兜底防止敏感信息泄露给前端。关键错误持久化到 `error_logs` 表，比 `console.error` 更方便回溯（生图失败率、webhook 成功率等运营指标直接查 `generations` 和 `payments` 表即可）。

## 异常告警

通过 Resend API 发送告警邮件，配置 `config.alert.email` 即可启用（免费 100 封/天）。

### 触发场景

| 场景 | 告警内容 |
|------|---------|
| `handleError` 未捕获异常 | 错误类型 + URL + 错误信息 |
| 支付 webhook 校验失败 | 订单 ID + 失败原因 |
| 生图连续失败（5 分钟内 ≥3 次） | 失败次数 + 最近的 failure_reason |
| Cron 清理僵尸订单 | 被清理的订单数量 |

### 频率限制（防风暴）

用 KV 做滑动窗口限流，防止异常风暴刷爆邮箱：

```typescript
// lib/alert.ts
export async function sendAlert(env: App.Platform['env'], subject: string, body: string) {
  if (!config.alert.email) return

  // KV 滑动窗口：检查最近 1 小时告警次数
  const key = `alert:count:${Math.floor(Date.now() / 3600000)}`
  const count = parseInt(await env.KV.get(key) ?? '0')
  if (count >= config.alert.maxPerHour) {
    // 超限只写 error_logs，不发邮件
    return
  }
  await env.KV.put(key, String(count + 1), { expirationTtl: 3600 })

  // 通过 Resend API 发送
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'alert@yourdomain.com',
      to: config.alert.email,
      subject: `[Alert] ${subject}`,
      text: body,
    }),
  })
}
```

### 关键设计

- **不阻塞主流程**：告警始终通过 `waitUntil()` 异步发送，不影响用户请求响应时间
- **降级策略**：超过 `maxPerHour` 阈值后静默降级为只写 `error_logs`，恢复后自动重新发送
- **`.dev.vars` 新增 `RESEND_API_KEY`**，本地开发不配则不发（`sendAlert` 开头已检查 `config.alert.email`）

## CI/CD 自动部署

预置 `.github/workflows/deploy.yml`，push to `main` 自动部署：

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

只需在 GitHub repo Settings → Secrets 中添加 `CLOUDFLARE_API_TOKEN`，后续改完代码 push 即自动构建部署，不再需要本地跑 `wrangler deploy`。

## 项目目录结构

```
src/
  routes/
    +error.svelte               -- 全局错误页（友好提示，不暴露 stack trace）
    [lang]/
      +page.svelte              -- 落地页
      +layout.svelte            -- 公共布局（导航、语言切换、footer）
      pricing/+page.svelte
      privacy/+page.svelte
      terms/+page.svelte
      app/
        +page.svelte            -- 生图主页
        +layout.svelte          -- app 布局（侧边栏、用户信息）
        gallery/+page.svelte
        account/+page.svelte
        billing/+page.svelte
    login/
      +page.svelte
      google/callback/+server.ts
    api/
      generate/+server.ts
      upload/+server.ts
      image/[...key]/+server.ts  -- R2 图片代理（校验权限 + 缩略图）
      checkout/+server.ts
      webhook/creem/+server.ts
      webhook/replicate/+server.ts
  lib/
    config.ts                   -- 功能开关 + 所有配置
    alert.ts                    -- 异常告警（Resend + KV 频率限制）
    ai/
      types.ts                  -- AIProvider 接口
      index.ts                  -- 当前 provider 导出
      providers/
        replicate.ts
    auth/
      lucia.ts                  -- Lucia 初始化
      google.ts                 -- Google OAuth 配置
    db/
      schema.ts                 -- Drizzle schema 定义（source of truth）
      index.ts                  -- Drizzle client 初始化
    i18n/
      index.ts                  -- t() 函数 + locale 检测
      messages/
        en.ts
        zh.ts
    components/
      SEO.svelte
      Toast.svelte
      Turnstile.svelte
  app.d.ts                      -- 全局类型声明（App.Locals / App.Platform）
  hooks.server.ts               -- 认证拦截 + 语言重定向 + 安全响应头 + 错误兜底
migrations/
  0000_initial.sql              -- 初始建表 + 索引
static/
  favicon.png                   -- 网站图标
  robots.txt                    -- Disallow: /app/，配合 sitemap
wrangler.toml
drizzle.config.ts               -- Drizzle Kit 配置
.env.example
.dev.vars.example               -- 后端机密模板
.github/
  workflows/
    deploy.yml                  -- GitHub Actions 自动部署
```

### 全局类型声明（src/app.d.ts）

```typescript
declare global {
  namespace App {
    interface Locals {
      user: import('lucia').User | null
      session: import('lucia').Session | null
    }
    interface Platform {
      env: {
        DB: D1Database
        R2: R2Bucket
        KV: KVNamespace
      }
      context: {
        waitUntil(promise: Promise<any>): void
      }
    }
  }
}
export {}
```
