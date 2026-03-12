# Web Starter Kit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready SvelteKit + Cloudflare starter kit with auth, payments, AI image generation, and i18n — all feature-flagged.

**Architecture:** SvelteKit deployed to Cloudflare Pages via adapter-cloudflare. D1 for database (Drizzle ORM), R2 for file storage, KV for session cache. Lucia Auth + Google OAuth. Creem payments. Replicate AI. Resend alerts.

**Tech Stack:** SvelteKit 2, Cloudflare Pages/D1/R2/KV, Drizzle ORM, Lucia Auth v3, Creem, Replicate, Cloudflare Turnstile, Resend

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`
- Create: `wrangler.toml`, `drizzle.config.ts`
- Create: `.env.example`, `.dev.vars.example`
- Create: `.gitignore`
- Create: `static/robots.txt`

**Step 1: Initialize SvelteKit project**

```bash
npx sv create web-starter-kit --template minimal --types ts
```

Wait — since we're already in the `web-starter-kit` directory, scaffold here:

```bash
npx sv create . --template minimal --types ts
```

If the CLI doesn't support `.`, create in a temp dir and move files.

**Step 2: Install core dependencies**

```bash
npm install drizzle-orm arctic @oslojs/crypto @oslojs/encoding replicate aws4fetch
npm install -D @sveltejs/adapter-cloudflare drizzle-kit wrangler @cloudflare/workers-types
```

Package explanations:
- `drizzle-orm` — Type-safe ORM for D1
- `arctic` — OAuth helper (Google provider)
- `@oslojs/crypto` — Session token hashing (SHA-256)
- `@oslojs/encoding` — Base32/hex encoding for tokens
- NOTE: Lucia v3 deprecated itself. We use its code recipes directly with @oslojs/* + arctic
- `replicate` — Replicate AI SDK
- `aws4fetch` — AWS Signature V4 for R2 presigned URLs (NOT @aws-sdk, which doesn't work in Workers)
- `@sveltejs/adapter-cloudflare` — Deploy to Cloudflare Pages
- `wrangler` — Cloudflare dev/deploy CLI
- `@cloudflare/workers-types` — TypeScript types for Workers APIs

**Step 3: Configure svelte.config.js**

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
  },
};

export default config;
```

**Step 4: Configure wrangler.toml**

```toml
name = "web-starter-kit"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"

[[r2_buckets]]
binding = "R2"

[[kv_namespaces]]
binding = "KV"

[triggers]
crons = ["*/15 * * * *"]
```

No resource IDs needed — Wrangler 4.45.0+ auto-creates them on first deploy.

**Step 5: Configure drizzle.config.ts**

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  out: './migrations',
  schema: './src/lib/server/db/schema.ts',
  dialect: 'sqlite',
} satisfies Config;
```

**Step 6: Create .env.example and .dev.vars.example**

`.env.example`:
```
PUBLIC_TURNSTILE_SITE_KEY=
PUBLIC_CF_WEB_ANALYTICS=
PUBLIC_GA4_ID=
```

`.dev.vars.example`:
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CREEM_API_KEY=
CREEM_WEBHOOK_SECRET=
REPLICATE_API_TOKEN=
RESEND_API_KEY=
TURNSTILE_SECRET_KEY=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
```

**Step 7: Create .gitignore**

Add to the SvelteKit default `.gitignore`:
```
.env
.dev.vars
.wrangler/
```

**Step 8: Create static/robots.txt**

```
User-agent: *
Disallow: /app/
Disallow: /api/

Sitemap: https://yourdomain.com/sitemap.xml
```

**Step 9: Create static/favicon.png**

Use a placeholder 32x32 PNG (can be replaced later).

**Step 10: Verify dev server starts**

```bash
npx wrangler dev
```

Expected: Dev server starts, shows local URL.

**Step 11: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold SvelteKit + Cloudflare project"
```

---

## Task 2: Global Types & Config

**Files:**
- Create: `src/app.d.ts`
- Create: `src/lib/config.ts`

**Step 1: Create src/app.d.ts**

```typescript
// src/app.d.ts
declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        email: string;
        name: string;
        avatarUrl: string | null;
        credits: number;
        plan: string;
      } | null;
      session: { id: string; expiresAt: Date } | null;
    }
    interface Platform {
      env: {
        DB: D1Database;
        R2: R2Bucket;
        KV: KVNamespace;
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
        CREEM_API_KEY: string;
        CREEM_WEBHOOK_SECRET: string;
        REPLICATE_API_TOKEN: string;
        RESEND_API_KEY: string;
        TURNSTILE_SECRET_KEY: string;
        R2_ACCESS_KEY_ID: string;
        R2_SECRET_ACCESS_KEY: string;
        R2_ENDPOINT: string;
      };
      context: {
        waitUntil(promise: Promise<any>): void;
      };
    }
  }
}
export {};
```

**Step 2: Create src/lib/config.ts**

```typescript
// src/lib/config.ts
export const config = {
  features: {
    auth: true,
    payments: true,
    credits: true,
    ai: true,
    turnstile: true,
    upload: true,
  },
  ai: {
    provider: 'replicate' as const,
    defaultModel: 'flux-1.1-pro',
  },
  credits: {
    costPerGeneration: 1,
    freeOnSignup: 10,
  },
  upload: {
    maxSizeMB: 10,
    allowedTypes: ['jpg', 'png', 'webp'] as const,
  },
  alert: {
    email: '',
    maxPerHour: 10,
  },
  analytics: {
    cloudflareWebAnalytics: '',
    googleAnalytics: '',
  },
  i18n: {
    defaultLocale: 'en' as const,
    locales: ['en', 'zh', 'ja', 'ko'] as const,
  },
};
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 4: Commit**

```bash
git add src/app.d.ts src/lib/config.ts
git commit -m "feat: add global types and feature config"
```

---

## Task 3: Database Schema & Migrations (Drizzle)

**Files:**
- Create: `src/lib/server/db/schema.ts`
- Create: `src/lib/server/db/index.ts`

**Step 1: Create Drizzle schema**

```typescript
// src/lib/server/db/schema.ts
import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  credits: integer('credits').default(0),
  plan: text('plan').default('free'),
  createdAt: integer('created_at').notNull(),
  deletedAt: integer('deleted_at'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at').notNull(),
}, (table) => [
  index('idx_sessions_user_id').on(table.userId),
]);

export const oauthAccounts = sqliteTable('oauth_accounts', {
  providerId: text('provider_id').notNull(),
  providerUserId: text('provider_user_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
}, (table) => [
  primaryKey({ columns: [table.providerId, table.providerUserId] }),
]);

export const generations = sqliteTable('generations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  prompt: text('prompt').notNull(),
  refImageUrl: text('ref_image_url'),
  resultUrl: text('result_url'),
  status: text('status').notNull().default('pending'),
  failureReason: text('failure_reason'),
  provider: text('provider'),
  model: text('model'),
  creditsUsed: integer('credits_used').default(1),
  createdAt: integer('created_at').notNull(),
  deletedAt: integer('deleted_at'),
}, (table) => [
  index('idx_generations_user_id').on(table.userId),
]);

export const creditLogs = sqliteTable('credit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  amount: integer('amount').notNull(),
  balance: integer('balance').notNull(),
  type: text('type').notNull(),
  refId: text('ref_id'),
  createdAt: integer('created_at').notNull(),
}, (table) => [
  index('idx_credit_logs_user_id').on(table.userId),
]);

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  creemOrderId: text('creem_order_id').unique(),
  type: text('type').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull(),
  creditsAdded: integer('credits_added').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at').notNull(),
}, (table) => [
  index('idx_payments_user_id').on(table.userId),
]);

export const errorLogs = sqliteTable('error_logs', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  message: text('message').notNull(),
  url: text('url'),
  createdAt: integer('created_at').notNull(),
});
```

**Step 2: Create Drizzle client factory**

```typescript
// src/lib/server/db/index.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDb>;
export { schema };
```

**Step 3: Generate initial migration**

```bash
npx drizzle-kit generate
```

Expected: Creates `migrations/0000_*.sql` with all CREATE TABLE and CREATE INDEX statements.

**Step 4: Verify migration applies locally**

```bash
npx wrangler d1 migrations apply DB --local
```

Expected: Migration applied successfully.

**Step 5: Commit**

```bash
git add src/lib/server/db/ migrations/ drizzle.config.ts
git commit -m "feat: add Drizzle schema with 7 tables and migrations"
```

---

## Task 4: i18n System

**Files:**
- Create: `src/lib/i18n/index.ts`
- Create: `src/lib/i18n/messages/en.ts`
- Create: `src/lib/i18n/messages/zh.ts`
- Create: `src/lib/i18n/messages/ja.ts`
- Create: `src/lib/i18n/messages/ko.ts`

**Step 1: Create English messages (source of truth)**

```typescript
// src/lib/i18n/messages/en.ts
export const en = {
  landing: {
    title: 'AI Image Generator',
    subtitle: 'Create stunning images with AI',
    cta: 'Get Started',
  },
  nav: {
    home: 'Home',
    pricing: 'Pricing',
    login: 'Login',
    app: 'Dashboard',
    gallery: 'Gallery',
    account: 'Account',
    logout: 'Logout',
  },
  auth: {
    loginWithGoogle: 'Sign in with Google',
    loginRequired: 'Please sign in to continue',
  },
  app: {
    promptPlaceholder: 'Describe the image you want to create...',
    generate: 'Generate',
    generating: 'Generating...',
    credits: 'Credits',
    noCredits: 'No credits remaining',
    uploadRef: 'Upload reference image',
  },
  gallery: {
    title: 'My Gallery',
    empty: 'No images yet. Create your first one!',
    status: {
      pending: 'Processing',
      done: 'Complete',
      failed: 'Failed',
    },
  },
  account: {
    title: 'Account',
    plan: 'Plan',
    credits: 'Credits',
    syncOrders: 'Sync Orders',
  },
  pricing: {
    title: 'Pricing',
    free: 'Free',
    freeDesc: '10 credits to start',
    starter: 'Starter',
    starterDesc: '100 credits',
    pro: 'Pro',
    proDesc: '500 credits',
    buy: 'Buy Now',
  },
  billing: {
    success: 'Payment successful! Credits added.',
    cancelled: 'Payment cancelled.',
  },
  errors: {
    notFound: 'Page not found',
    serverError: 'Something went wrong',
    tryAgain: 'Try again',
    goHome: 'Go home',
  },
  footer: {
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
  },
} as const;

export type Messages = typeof en;
```

**Step 2: Create Chinese messages**

```typescript
// src/lib/i18n/messages/zh.ts
import type { Messages } from './en';

export const zh: Messages = {
  landing: {
    title: 'AI 图片生成器',
    subtitle: '用 AI 创造令人惊艳的图片',
    cta: '立即开始',
  },
  nav: {
    home: '首页',
    pricing: '定价',
    login: '登录',
    app: '工作台',
    gallery: '图库',
    account: '账户',
    logout: '退出',
  },
  auth: {
    loginWithGoogle: '使用 Google 登录',
    loginRequired: '请先登录',
  },
  app: {
    promptPlaceholder: '描述你想生成的图片...',
    generate: '生成',
    generating: '生成中...',
    credits: '积分',
    noCredits: '积分不足',
    uploadRef: '上传参考图',
  },
  gallery: {
    title: '我的图库',
    empty: '还没有图片，创建第一张吧！',
    status: {
      pending: '处理中',
      done: '完成',
      failed: '失败',
    },
  },
  account: {
    title: '账户',
    plan: '套餐',
    credits: '积分',
    syncOrders: '同步订单',
  },
  pricing: {
    title: '定价',
    free: '免费',
    freeDesc: '赠送 10 积分',
    starter: '入门版',
    starterDesc: '100 积分',
    pro: '专业版',
    proDesc: '500 积分',
    buy: '立即购买',
  },
  billing: {
    success: '支付成功！积分已到账。',
    cancelled: '支付已取消。',
  },
  errors: {
    notFound: '页面未找到',
    serverError: '出了点问题',
    tryAgain: '重试',
    goHome: '回到首页',
  },
  footer: {
    privacy: '隐私政策',
    terms: '服务条款',
  },
};
```

**Step 3: Create Japanese and Korean messages**

Create `ja.ts` and `ko.ts` with the same structure, using `satisfies Messages` pattern. Use AI-translated content as placeholder, mark with TODO for human review.

**Step 4: Create i18n utility**

```typescript
// src/lib/i18n/index.ts
import { config } from '$lib/config';
import { en } from './messages/en';
import { zh } from './messages/zh';
import { ja } from './messages/ja';
import { ko } from './messages/ko';
import type { Messages } from './messages/en';

const messages: Record<string, Messages> = { en, zh, ja, ko };

export function getMessages(locale: string): Messages {
  return messages[locale] ?? messages[config.i18n.defaultLocale];
}

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string
    ? T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K
    : never
  }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<Messages>;

export function t(locale: string, key: string): string {
  const msg = getMessages(locale);
  const parts = key.split('.');
  let result: any = msg;
  for (const part of parts) {
    result = result?.[part];
  }
  return typeof result === 'string' ? result : key;
}

export function isValidLocale(locale: string): boolean {
  return (config.i18n.locales as readonly string[]).includes(locale);
}

export function detectLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return config.i18n.defaultLocale;
  const preferred = acceptLanguage.split(',')
    .map(part => part.split(';')[0].trim().split('-')[0])
    .find(lang => isValidLocale(lang));
  return preferred ?? config.i18n.defaultLocale;
}
```

**Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors. Missing key in any locale file → compile error.

**Step 6: Commit**

```bash
git add src/lib/i18n/
git commit -m "feat: add i18n system with type-safe translations"
```

---

## Task 5: Auth — Session Management + Google OAuth

> **Note:** Lucia v3 deprecated itself. We follow its code recipes using `@oslojs/crypto` + `@oslojs/encoding` + `arctic` directly.

**Files:**
- Create: `src/lib/server/auth/session.ts`
- Create: `src/lib/server/auth/google.ts`
- Create: `src/routes/login/+page.svelte`
- Create: `src/routes/login/+page.server.ts`
- Create: `src/routes/login/google/+server.ts`
- Create: `src/routes/login/google/callback/+server.ts`

**Step 1: Create session management (replaces Lucia)**

```typescript
// src/lib/server/auth/session.ts
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { createDb } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const SESSION_DURATION = 1000 * 60 * 60 * 24 * 30; // 30 days
const REFRESH_THRESHOLD = 1000 * 60 * 60 * 24 * 15; // 15 days

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

function hashToken(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(d1: D1Database, token: string, userId: string) {
  const db = createDb(d1);
  const sessionId = hashToken(token);
  const expiresAt = Date.now() + SESSION_DURATION;
  await db.insert(sessions).values({ id: sessionId, userId, expiresAt });
  return { id: sessionId, userId, expiresAt: new Date(expiresAt) };
}

export async function validateSession(d1: D1Database, token: string) {
  const db = createDb(d1);
  const sessionId = hashToken(token);

  const result = await db.select()
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .get();

  if (!result) return { session: null, user: null };

  const session = result.sessions;
  const user = result.users;

  if (user.deletedAt || Date.now() >= session.expiresAt) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return { session: null, user: null };
  }

  // Auto-extend if within refresh threshold
  let fresh = false;
  if (Date.now() >= session.expiresAt - REFRESH_THRESHOLD) {
    const newExpiry = Date.now() + SESSION_DURATION;
    await db.update(sessions).set({ expiresAt: newExpiry }).where(eq(sessions.id, sessionId));
    session.expiresAt = newExpiry;
    fresh = true;
  }

  return {
    session: { id: session.id, userId: session.userId, expiresAt: new Date(session.expiresAt), fresh },
    user: {
      id: user.id,
      email: user.email!,
      name: user.name!,
      avatarUrl: user.avatarUrl,
      credits: user.credits!,
      plan: user.plan!,
    },
  };
}

export async function invalidateSession(d1: D1Database, sessionId: string) {
  const db = createDb(d1);
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export const SESSION_COOKIE = 'session';

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    expires: expiresAt,
    path: '/',
    secure: true,
  };
}
```

**Step 2: Create Google OAuth helper**

```typescript
// src/lib/server/auth/google.ts
import { Google } from 'arctic';

export function createGoogleOAuth(clientId: string, clientSecret: string, redirectUri: string) {
  return new Google(clientId, clientSecret, redirectUri);
}
```

**Step 3: Create login page**

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  // Login page with Google OAuth button
</script>

<div class="login-container">
  <h1>Sign In</h1>
  <a href="/login/google" class="google-btn">
    Sign in with Google
  </a>
</div>
```

**Step 4: Create login server-side redirect**

```typescript
// src/routes/login/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, '/en/app');
  }
};
```

**Step 5: Create Google OAuth initiation route**

```typescript
// src/routes/login/google/+server.ts
import { redirect } from '@sveltejs/kit';
import { generateState, generateCodeVerifier } from 'arctic';
import { createGoogleOAuth } from '$lib/server/auth/google';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, platform, url }) => {
  const env = platform!.env;
  const google = createGoogleOAuth(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${url.origin}/login/google/callback`
  );

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const authUrl = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

  cookies.set('google_oauth_state', state, {
    path: '/', secure: true, httpOnly: true, maxAge: 60 * 10, sameSite: 'lax',
  });
  cookies.set('google_code_verifier', codeVerifier, {
    path: '/', secure: true, httpOnly: true, maxAge: 60 * 10, sameSite: 'lax',
  });

  throw redirect(302, authUrl.toString());
};
```

**Step 6: Create OAuth callback handler**

```typescript
// src/routes/login/google/callback/+server.ts
import { redirect, error } from '@sveltejs/kit';
import { createGoogleOAuth } from '$lib/server/auth/google';
import { generateSessionToken, createSession, SESSION_COOKIE, sessionCookieOptions } from '$lib/server/auth/session';
import { createDb } from '$lib/server/db';
import { users, oauthAccounts } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { config } from '$lib/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
  const env = platform!.env;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('google_oauth_state');
  const codeVerifier = cookies.get('google_code_verifier');

  if (!code || !state || state !== storedState || !codeVerifier) {
    throw error(400, 'Invalid OAuth callback');
  }

  const google = createGoogleOAuth(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${url.origin}/login/google/callback`
  );

  const tokens = await google.validateAuthorizationCode(code, codeVerifier);
  const accessToken = tokens.accessToken();

  // Fetch user info from Google
  const googleUserRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const googleUser = await googleUserRes.json() as {
    sub: string; email: string; name: string; picture: string;
  };

  const db = createDb(env.DB);

  // Check if OAuth account exists
  const existingAccount = await db.select()
    .from(oauthAccounts)
    .where(and(
      eq(oauthAccounts.providerId, 'google'),
      eq(oauthAccounts.providerUserId, googleUser.sub)
    ))
    .get();

  let userId: string;

  if (existingAccount) {
    userId = existingAccount.userId;
  } else {
    // Create new user
    userId = crypto.randomUUID();
    await db.batch([
      db.insert(users).values({
        id: userId,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        credits: config.credits.freeOnSignup,
        createdAt: Date.now(),
      }),
      db.insert(oauthAccounts).values({
        providerId: 'google',
        providerUserId: googleUser.sub,
        userId,
      }),
    ]);
  }

  // Create session
  const token = generateSessionToken();
  const session = await createSession(env.DB, token, userId);

  cookies.set(SESSION_COOKIE, token, sessionCookieOptions(session.expiresAt));

  // Cache session in KV
  const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
  await env.KV.put(`session:${session.id}`, JSON.stringify({
    userId,
    expiresAt: session.expiresAt.getTime(),
  }), { expirationTtl: ttl });

  throw redirect(302, '/en/app');
};
```

**Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 8: Commit**

```bash
git add src/lib/server/auth/ src/routes/login/
git commit -m "feat: add session auth with Google OAuth (oslojs + arctic)"
```

---

## Task 6: Server Hooks (Auth + i18n + Security Headers + Error Handling)

**Files:**
- Create: `src/hooks.server.ts`

**Step 1: Create hooks.server.ts**

```typescript
// src/hooks.server.ts
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { validateSession, SESSION_COOKIE, sessionCookieOptions } from '$lib/server/auth/session';
import { createDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { config } from '$lib/config';
import { isValidLocale, detectLocale } from '$lib/i18n';
import { sendAlert } from '$lib/server/alert';

const handleAuth: Handle = async ({ event, resolve }) => {
  if (!config.features.auth) {
    return resolve(event);
  }

  const env = event.platform?.env;
  if (!env) return resolve(event);

  const token = event.cookies.get(SESSION_COOKIE);
  if (!token) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  // Try KV cache first
  // (KV stores hashed session ID → user data, but we need the raw token to hash)
  const { session, user } = await validateSession(env.DB, token);

  if (session?.fresh) {
    event.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(session.expiresAt));
  }
  if (!session) {
    event.cookies.delete(SESSION_COOKIE, { path: '/' });
  }

  event.locals.user = user;
  event.locals.session = session ? { id: session.id, expiresAt: session.expiresAt } : null;

  return resolve(event);
};

const handleI18n: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  // Skip API and login routes
  if (pathname.startsWith('/api/') || pathname.startsWith('/login')) {
    return resolve(event);
  }

  // Check if URL has valid locale prefix
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (!firstSegment || !isValidLocale(firstSegment)) {
    // Redirect to locale-prefixed URL
    const locale = detectLocale(event.request.headers.get('accept-language'));
    const target = `/${locale}${pathname === '/' ? '' : pathname}`;
    throw redirect(301, target);
  }

  return resolve(event);
};

const handleProtectedRoutes: Handle = async ({ event, resolve }) => {
  if (!config.features.auth) return resolve(event);

  const { pathname } = event.url;
  // Match /xx/app or /xx/app/*
  if (/^\/[a-z]{2}\/app(\/|$)/.test(pathname) && !event.locals.user) {
    throw redirect(302, '/login');
  }

  return resolve(event);
};

const handleSecurityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' https://*.google-analytics.com"
  );
  return response;
};

export const handle = sequence(handleAuth, handleI18n, handleProtectedRoutes, handleSecurityHeaders);

export const handleError: HandleServerError = ({ error, event }) => {
  console.error('Unhandled error:', error);

  const env = event.platform?.env;
  if (env) {
    event.platform?.context.waitUntil(
      (async () => {
        // Log to D1
        await env.DB.prepare(
          'INSERT INTO error_logs (id, type, message, url, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), 'unhandled', String(error), event.url.pathname, Date.now()).run();

        // Send alert
        await sendAlert(env, 'Unhandled Error', `URL: ${event.url.pathname}\nError: ${String(error)}`);
      })()
    );
  }

  return {
    message: 'Something went wrong',
    code: 'INTERNAL_ERROR',
  };
};
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/hooks.server.ts
git commit -m "feat: add server hooks for auth, i18n, security headers, error handling"
```

---

## Task 7: Alert System

**Files:**
- Create: `src/lib/server/alert.ts`

**Step 1: Create alert module**

```typescript
// src/lib/server/alert.ts
import { config } from '$lib/config';

export async function sendAlert(
  env: App.Platform['env'],
  subject: string,
  body: string
): Promise<void> {
  if (!config.alert.email) return;

  // KV sliding window rate limit
  const key = `alert:count:${Math.floor(Date.now() / 3600000)}`;
  const count = parseInt((await env.KV.get(key)) ?? '0');
  if (count >= config.alert.maxPerHour) return;

  await env.KV.put(key, String(count + 1), { expirationTtl: 3600 });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'alert@yourdomain.com',
      to: config.alert.email,
      subject: `[Alert] ${subject}`,
      text: body,
    }),
  });
}
```

**Step 2: Commit**

```bash
git add src/lib/server/alert.ts
git commit -m "feat: add alert system with KV rate limiting"
```

---

## Task 8: AI Provider Interface + Replicate Implementation

**Files:**
- Create: `src/lib/server/ai/types.ts`
- Create: `src/lib/server/ai/providers/replicate.ts`
- Create: `src/lib/server/ai/index.ts`

**Step 1: Create AI provider interface**

```typescript
// src/lib/server/ai/types.ts
export interface GenerateParams {
  prompt: string;
  refImageUrl?: string;
  model?: string;
  webhookUrl?: string;
}

export interface GenerateResult {
  imageUrl: string;
  predictionId: string;
  model: string;
  provider: string;
}

export interface AIProvider {
  supportsWebhook: boolean;
  generate(params: GenerateParams): Promise<GenerateResult>;
}
```

**Step 2: Create Replicate provider**

```typescript
// src/lib/server/ai/providers/replicate.ts
import Replicate from 'replicate';
import type { AIProvider, GenerateParams, GenerateResult } from '../types';

export function createReplicateProvider(apiToken: string): AIProvider {
  const replicate = new Replicate({ auth: apiToken });

  return {
    supportsWebhook: true,

    async generate(params: GenerateParams): Promise<GenerateResult> {
      const model = params.model ?? 'black-forest-labs/flux-1.1-pro';
      const input: Record<string, any> = { prompt: params.prompt };

      if (params.refImageUrl) {
        input.image = params.refImageUrl;
      }

      if (params.webhookUrl) {
        const prediction = await replicate.predictions.create({
          model,
          input,
          webhook: params.webhookUrl,
          webhook_events_filter: ['completed'],
        });

        return {
          imageUrl: '',
          predictionId: prediction.id,
          model,
          provider: 'replicate',
        };
      }

      // Sync mode
      const output = await replicate.run(model, { input });
      const imageUrl = Array.isArray(output) ? output[0] : String(output);

      return {
        imageUrl,
        predictionId: '',
        model,
        provider: 'replicate',
      };
    },
  };
}
```

**Step 3: Create AI index (provider factory)**

```typescript
// src/lib/server/ai/index.ts
import { config } from '$lib/config';
import { createReplicateProvider } from './providers/replicate';
import type { AIProvider } from './types';

export function createAIProvider(env: App.Platform['env']): AIProvider {
  switch (config.ai.provider) {
    case 'replicate':
      return createReplicateProvider(env.REPLICATE_API_TOKEN);
    default:
      throw new Error(`Unknown AI provider: ${config.ai.provider}`);
  }
}

export type { AIProvider, GenerateParams, GenerateResult } from './types';
```

**Step 4: Commit**

```bash
git add src/lib/server/ai/
git commit -m "feat: add pluggable AI provider with Replicate implementation"
```

---

## Task 9: Shared Components

**Files:**
- Create: `src/lib/components/SEO.svelte`
- Create: `src/lib/components/Toast.svelte`
- Create: `src/lib/components/Turnstile.svelte`

**Step 1: Create SEO component**

```svelte
<!-- src/lib/components/SEO.svelte -->
<script lang="ts">
  import { config } from '$lib/config';
  import { page } from '$app/stores';

  export let title: string;
  export let description: string;
  export let ogImage: string = '';

  $: currentUrl = $page.url.href;
  $: locale = $page.params.lang ?? config.i18n.defaultLocale;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={currentUrl} />
  {#if ogImage}
    <meta property="og:image" content={ogImage} />
  {/if}

  {#each config.i18n.locales as lang}
    <link
      rel="alternate"
      hreflang={lang}
      href={currentUrl.replace(`/${locale}/`, `/${lang}/`)}
    />
  {/each}
  <link
    rel="alternate"
    hreflang="x-default"
    href={currentUrl.replace(`/${locale}/`, `/${config.i18n.defaultLocale}/`)}
  />
</svelte:head>
```

**Step 2: Create Toast component**

```svelte
<!-- src/lib/components/Toast.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';

  type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };

  export const toasts = writable<Toast[]>([]);

  let counter = 0;

  export function showToast(message: string, type: Toast['type'] = 'info') {
    const id = ++counter;
    toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => {
      toasts.update(t => t.filter(toast => toast.id !== id));
    }, 4000);
  }
</script>

<div class="toast-container">
  {#each $toasts as toast (toast.id)}
    <div class="toast toast-{toast.type}">
      {toast.message}
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .toast {
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    color: white;
    font-size: 0.875rem;
    animation: slideIn 0.3s ease;
  }
  .toast-success { background: #16a34a; }
  .toast-error { background: #dc2626; }
  .toast-info { background: #2563eb; }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
</style>
```

**Step 3: Create Turnstile component**

```svelte
<!-- src/lib/components/Turnstile.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { config } from '$lib/config';
  import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';

  export let token = '';

  let widgetId: string;

  onMount(() => {
    if (!config.features.turnstile || !PUBLIC_TURNSTILE_SITE_KEY) return;

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
    script.async = true;

    (window as any).onTurnstileLoad = () => {
      widgetId = (window as any).turnstile.render('#turnstile-widget', {
        sitekey: PUBLIC_TURNSTILE_SITE_KEY,
        callback: (t: string) => { token = t; },
      });
    };

    document.head.appendChild(script);
  });
</script>

{#if config.features.turnstile}
  <div id="turnstile-widget"></div>
{/if}
```

**Step 4: Commit**

```bash
git add src/lib/components/
git commit -m "feat: add SEO, Toast, and Turnstile components"
```

---

## Task 10: Layouts & Landing Page

**Files:**
- Create: `src/routes/[lang]/+layout.svelte`
- Create: `src/routes/[lang]/+layout.server.ts`
- Create: `src/routes/[lang]/+page.svelte`
- Create: `src/routes/[lang]/+page.server.ts`
- Create: `src/routes/+error.svelte`

**Step 1: Create lang layout server load**

```typescript
// src/routes/[lang]/+layout.server.ts
import { error } from '@sveltejs/kit';
import { isValidLocale } from '$lib/i18n';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals }) => {
  if (!isValidLocale(params.lang)) {
    throw error(404, 'Not found');
  }
  return {
    lang: params.lang,
    user: locals.user,
  };
};
```

**Step 2: Create lang layout**

```svelte
<!-- src/routes/[lang]/+layout.svelte -->
<script lang="ts">
  import { getMessages } from '$lib/i18n';
  import { config } from '$lib/config';
  import Toast from '$lib/components/Toast.svelte';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
  $: msg = getMessages(data.lang);
</script>

<nav>
  <a href="/{data.lang}/">{msg.nav.home}</a>
  {#if config.features.payments}
    <a href="/{data.lang}/pricing">{msg.nav.pricing}</a>
  {/if}
  <div class="nav-right">
    {#if data.user}
      <a href="/{data.lang}/app">{msg.nav.app}</a>
      <span>{data.user.name}</span>
    {:else if config.features.auth}
      <a href="/login">{msg.nav.login}</a>
    {/if}
    <!-- Language switcher -->
    {#each config.i18n.locales as locale}
      <a href="/{locale}/" class:active={data.lang === locale}>{locale.toUpperCase()}</a>
    {/each}
  </div>
</nav>

<main>
  <slot />
</main>

<footer>
  <a href="/{data.lang}/privacy">{msg.footer.privacy}</a>
  <a href="/{data.lang}/terms">{msg.footer.terms}</a>
</footer>

<Toast />
```

**Step 3: Create landing page**

```svelte
<!-- src/routes/[lang]/+page.svelte -->
<script lang="ts">
  import { getMessages } from '$lib/i18n';
  import SEO from '$lib/components/SEO.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  $: msg = getMessages(data.lang);
</script>

<SEO title={msg.landing.title} description={msg.landing.subtitle} />

<section class="hero">
  <h1>{msg.landing.title}</h1>
  <p>{msg.landing.subtitle}</p>
  <a href="/{data.lang}/app" class="cta-btn">{msg.landing.cta}</a>
</section>
```

**Step 4: Create error page**

```svelte
<!-- src/routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="error-page">
  <h1>{$page.status}</h1>
  <p>{$page.error?.message ?? 'Something went wrong'}</p>
  <a href="/">Go home</a>
</div>
```

**Step 5: Verify dev server renders landing page**

```bash
npx wrangler dev
```

Visit `http://localhost:8787/en/` — should show landing page.

**Step 6: Commit**

```bash
git add src/routes/
git commit -m "feat: add layouts, landing page, and error page"
```

---

## Task 11: App Pages (Dashboard, Gallery, Account, Billing)

**Files:**
- Create: `src/routes/[lang]/app/+layout.svelte`
- Create: `src/routes/[lang]/app/+layout.server.ts`
- Create: `src/routes/[lang]/app/+page.svelte`
- Create: `src/routes/[lang]/app/+page.server.ts`
- Create: `src/routes/[lang]/app/gallery/+page.svelte`
- Create: `src/routes/[lang]/app/gallery/+page.server.ts`
- Create: `src/routes/[lang]/app/account/+page.svelte`
- Create: `src/routes/[lang]/app/account/+page.server.ts`
- Create: `src/routes/[lang]/app/billing/+page.svelte`

**Step 1: Create app layout**

```typescript
// src/routes/[lang]/app/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params }) => {
  if (!locals.user) throw redirect(302, '/login');
  return { user: locals.user, lang: params.lang };
};
```

```svelte
<!-- src/routes/[lang]/app/+layout.svelte -->
<script lang="ts">
  import { getMessages } from '$lib/i18n';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
  $: msg = getMessages(data.lang);
</script>

<div class="app-layout">
  <aside>
    <div class="user-info">
      {#if data.user.avatarUrl}
        <img src={data.user.avatarUrl} alt="" width="40" height="40" />
      {/if}
      <span>{data.user.name}</span>
    </div>
    <nav>
      <a href="/{data.lang}/app">{msg.nav.app}</a>
      <a href="/{data.lang}/app/gallery">{msg.nav.gallery}</a>
      <a href="/{data.lang}/app/account">{msg.nav.account}</a>
    </nav>
    <div class="credits">
      {msg.app.credits}: {data.user.credits}
    </div>
  </aside>
  <div class="app-content">
    <slot />
  </div>
</div>
```

**Step 2: Create generate page (main app)**

```typescript
// src/routes/[lang]/app/+page.server.ts
import { fail } from '@sveltejs/kit';
import { config } from '$lib/config';
import { createDb } from '$lib/server/db';
import { generations, creditLogs, users } from '$lib/server/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { createAIProvider } from '$lib/server/ai';
import { sendAlert } from '$lib/server/alert';
import type { Actions } from './$types';

export const actions: Actions = {
  generate: async ({ request, locals, platform, url }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });
    if (!config.features.ai) return fail(400, { error: 'AI disabled' });

    const env = platform!.env;
    const db = createDb(env.DB);
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const refImageUrl = formData.get('refImageUrl') as string | null;

    if (!prompt?.trim()) return fail(400, { error: 'Prompt required' });

    // Rate limit: 5 per minute per user
    const recentCount = await db.select({ count: sql<number>`count(*)` })
      .from(generations)
      .where(and(
        eq(generations.userId, locals.user.id),
        sql`created_at > ${Date.now() - 60000}`
      ))
      .get();
    if (recentCount && recentCount.count >= 5) {
      return fail(429, { error: 'Too many requests' });
    }

    // Freeze credits (database as arbiter)
    const cost = config.credits.costPerGeneration;
    if (config.features.credits) {
      const result = await db.update(users)
        .set({ credits: sql`credits - ${cost}` })
        .where(and(eq(users.id, locals.user.id), sql`credits >= ${cost}`))
        .returning({ credits: users.credits });
      if (!result.length) return fail(402, { error: 'Insufficient credits' });
    }

    const generationId = crypto.randomUUID();
    await db.insert(generations).values({
      id: generationId,
      userId: locals.user.id,
      prompt,
      refImageUrl,
      status: 'pending',
      provider: config.ai.provider,
      model: config.ai.defaultModel,
      creditsUsed: cost,
      createdAt: Date.now(),
    });

    if (config.features.credits) {
      const userRow = await db.select({ credits: users.credits })
        .from(users).where(eq(users.id, locals.user.id)).get();
      await db.insert(creditLogs).values({
        id: crypto.randomUUID(),
        userId: locals.user.id,
        amount: -cost,
        balance: userRow!.credits!,
        type: 'freeze',
        refId: generationId,
        createdAt: Date.now(),
      });
    }

    // Call AI provider
    const ai = createAIProvider(env);
    try {
      const result = await ai.generate({
        prompt,
        refImageUrl: refImageUrl ?? undefined,
        model: config.ai.defaultModel,
        webhookUrl: ai.supportsWebhook
          ? `${url.origin}/api/webhook/replicate`
          : undefined,
      });

      if (!ai.supportsWebhook && result.imageUrl) {
        // Sync mode: download and store in R2
        platform!.context.waitUntil(
          (async () => {
            const imgRes = await fetch(result.imageUrl);
            const imgData = await imgRes.arrayBuffer();
            const r2Key = `generations/${locals.user!.id}/${generationId}.png`;
            await env.R2.put(r2Key, imgData);
            await db.update(generations)
              .set({ status: 'done', resultUrl: r2Key })
              .where(eq(generations.id, generationId));
          })()
        );
      } else if (ai.supportsWebhook) {
        // Update prediction ID for webhook correlation
        await db.update(generations)
          .set({ status: 'processing' })
          .where(eq(generations.id, generationId));
      }

      return { generationId };
    } catch (err) {
      // Unfreeze credits on failure
      if (config.features.credits) {
        await db.update(users)
          .set({ credits: sql`credits + ${cost}` })
          .where(eq(users.id, locals.user.id));
        const userRow = await db.select({ credits: users.credits })
          .from(users).where(eq(users.id, locals.user.id)).get();
        await db.insert(creditLogs).values({
          id: crypto.randomUUID(),
          userId: locals.user.id,
          amount: cost,
          balance: userRow!.credits!,
          type: 'unfreeze',
          refId: generationId,
          createdAt: Date.now(),
        });
      }
      await db.update(generations)
        .set({ status: 'failed', failureReason: 'api_error' })
        .where(eq(generations.id, generationId));

      platform!.context.waitUntil(
        sendAlert(env, 'AI Generation Failed', `User: ${locals.user.id}\nError: ${String(err)}`)
      );

      return fail(500, { error: 'Generation failed' });
    }
  },
};
```

```svelte
<!-- src/routes/[lang]/app/+page.svelte -->
<script lang="ts">
  import { getMessages } from '$lib/i18n';
  import { config } from '$lib/config';
  import Turnstile from '$lib/components/Turnstile.svelte';
  import SEO from '$lib/components/SEO.svelte';
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  export let data: PageData;
  export let form: ActionData;
  $: msg = getMessages(data.lang);

  let generating = false;
  let turnstileToken = '';
</script>

<SEO title={msg.nav.app} description={msg.landing.subtitle} />

<div class="generate-page">
  <form
    method="POST"
    action="?/generate"
    use:enhance={() => {
      generating = true;
      return async ({ update }) => {
        generating = false;
        await update();
      };
    }}
  >
    <textarea
      name="prompt"
      placeholder={msg.app.promptPlaceholder}
      rows="3"
      required
    ></textarea>

    {#if config.features.upload}
      <input type="file" accept="image/jpeg,image/png,image/webp" />
    {/if}

    <Turnstile bind:token={turnstileToken} />

    <button type="submit" disabled={generating}>
      {generating ? msg.app.generating : msg.app.generate}
    </button>
  </form>

  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
</div>
```

**Step 3: Create gallery page**

```typescript
// src/routes/[lang]/app/gallery/+page.server.ts
import { createDb } from '$lib/server/db';
import { generations } from '$lib/server/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  const db = createDb(platform!.env.DB);
  const items = await db.select()
    .from(generations)
    .where(eq(generations.userId, locals.user!.id))
    .where(isNull(generations.deletedAt))
    .orderBy(desc(generations.createdAt))
    .limit(50);

  return { generations: items };
};
```

```svelte
<!-- src/routes/[lang]/app/gallery/+page.svelte -->
<script lang="ts">
  import { getMessages } from '$lib/i18n';
  import SEO from '$lib/components/SEO.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  $: msg = getMessages(data.lang);
</script>

<SEO title={msg.gallery.title} description={msg.gallery.title} />

<h1>{msg.gallery.title}</h1>

{#if data.generations.length === 0}
  <p>{msg.gallery.empty}</p>
{:else}
  <div class="gallery-grid">
    {#each data.generations as gen}
      <div class="gallery-item">
        {#if gen.status === 'done' && gen.resultUrl}
          <img
            src="/api/image/{gen.resultUrl}?w=300"
            alt={gen.prompt}
            loading="lazy"
            decoding="async"
          />
        {:else}
          <div class="status-badge">{msg.gallery.status[gen.status as keyof typeof msg.gallery.status]}</div>
        {/if}
        <p class="prompt">{gen.prompt}</p>
      </div>
    {/each}
  </div>
{/if}
```

**Step 4: Create account page**

```typescript
// src/routes/[lang]/app/account/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  return { user: locals.user! };
};
```

```svelte
<!-- src/routes/[lang]/app/account/+page.svelte -->
<script lang="ts">
  import { getMessages } from '$lib/i18n';
  import SEO from '$lib/components/SEO.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  $: msg = getMessages(data.lang);
</script>

<SEO title={msg.account.title} description={msg.account.title} />

<h1>{msg.account.title}</h1>

<div class="account-info">
  <p>{msg.account.plan}: {data.user.plan}</p>
  <p>{msg.account.credits}: {data.user.credits}</p>
</div>

<button onclick="/* TODO: sync orders API call */">
  {msg.account.syncOrders}
</button>
```

**Step 5: Create billing page**

```svelte
<!-- src/routes/[lang]/app/billing/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { getMessages } from '$lib/i18n';
  import SEO from '$lib/components/SEO.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  $: msg = getMessages(data.lang);
  $: status = $page.url.searchParams.get('status');
</script>

<SEO title={msg.billing.success} description="" />

<div class="billing-result">
  {#if status === 'success'}
    <p>{msg.billing.success}</p>
  {:else}
    <p>{msg.billing.cancelled}</p>
  {/if}
  <a href="/{data.lang}/app">← {msg.nav.app}</a>
</div>
```

**Step 6: Commit**

```bash
git add src/routes/\[lang\]/app/
git commit -m "feat: add app pages — generate, gallery, account, billing"
```

---

## Task 12: Static Pages (Pricing, Privacy, Terms)

**Files:**
- Create: `src/routes/[lang]/pricing/+page.svelte`
- Create: `src/routes/[lang]/privacy/+page.svelte`
- Create: `src/routes/[lang]/terms/+page.svelte`

**Step 1: Create pricing page**

```svelte
<!-- src/routes/[lang]/pricing/+page.svelte -->
<script lang="ts">
  import { getMessages } from '$lib/i18n';
  import SEO from '$lib/components/SEO.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
  $: msg = getMessages(data.lang);
</script>

<SEO title={msg.pricing.title} description={msg.pricing.title} />

<h1>{msg.pricing.title}</h1>

<div class="pricing-grid">
  <div class="pricing-card">
    <h2>{msg.pricing.free}</h2>
    <p>{msg.pricing.freeDesc}</p>
    <p class="price">$0</p>
  </div>
  <div class="pricing-card">
    <h2>{msg.pricing.starter}</h2>
    <p>{msg.pricing.starterDesc}</p>
    <p class="price">$9</p>
    <a href="/api/checkout?plan=starter" class="buy-btn">{msg.pricing.buy}</a>
  </div>
  <div class="pricing-card">
    <h2>{msg.pricing.pro}</h2>
    <p>{msg.pricing.proDesc}</p>
    <p class="price">$29</p>
    <a href="/api/checkout?plan=pro" class="buy-btn">{msg.pricing.buy}</a>
  </div>
</div>
```

**Step 2: Create privacy and terms pages**

```svelte
<!-- src/routes/[lang]/privacy/+page.svelte -->
<script lang="ts">
  import SEO from '$lib/components/SEO.svelte';
</script>

<SEO title="Privacy Policy" description="Privacy Policy" />

<h1>Privacy Policy</h1>
<p>TODO: Add privacy policy content.</p>
```

```svelte
<!-- src/routes/[lang]/terms/+page.svelte -->
<script lang="ts">
  import SEO from '$lib/components/SEO.svelte';
</script>

<SEO title="Terms of Service" description="Terms of Service" />

<h1>Terms of Service</h1>
<p>TODO: Add terms of service content.</p>
```

**Step 3: Commit**

```bash
git add src/routes/\[lang\]/pricing/ src/routes/\[lang\]/privacy/ src/routes/\[lang\]/terms/
git commit -m "feat: add pricing, privacy, and terms pages"
```

---

## Task 13: API Routes — Generate, Upload, Image Proxy

**Files:**
- Create: `src/routes/api/generate/+server.ts`
- Create: `src/routes/api/upload/+server.ts`
- Create: `src/routes/api/image/[...key]/+server.ts`

**Step 1: Create generate API**

```typescript
// src/routes/api/generate/+server.ts
import { json, error } from '@sveltejs/kit';
import { createDb } from '$lib/server/db';
import { generations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET: Poll generation status
export const GET: RequestHandler = async ({ url, locals, platform }) => {
  if (!locals.user) throw error(401, 'Unauthorized');

  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'Missing id');

  const db = createDb(platform!.env.DB);
  const gen = await db.select()
    .from(generations)
    .where(eq(generations.id, id))
    .get();

  if (!gen || gen.userId !== locals.user.id) throw error(404, 'Not found');

  return json({
    status: gen.status,
    resultUrl: gen.status === 'done' ? `/api/image/${gen.resultUrl}` : null,
    failureReason: gen.failureReason,
  });
};
```

**Step 2: Create upload API (presigned URL)**

```typescript
// src/routes/api/upload/+server.ts
import { json, error } from '@sveltejs/kit';
import { AwsClient } from 'aws4fetch';
import { config } from '$lib/config';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, platform }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!config.features.upload) throw error(400, 'Upload disabled');

  const env = platform!.env;
  const fileKey = `uploads/${locals.user.id}/${crypto.randomUUID()}`;

  // Store upload token in KV (TTL 5 min)
  await env.KV.put(`upload:${fileKey}`, locals.user.id, { expirationTtl: 300 });

  // Generate presigned PUT URL via aws4fetch
  const r2 = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });

  const presignedUrl = await r2.sign(
    new Request(`${env.R2_ENDPOINT}/${fileKey}`, {
      method: 'PUT',
    }),
    { aws: { signQuery: true } }
  );

  return json({
    uploadUrl: presignedUrl.url,
    fileKey,
  });
};
```

**Step 3: Create image proxy**

```typescript
// src/routes/api/image/[...key]/+server.ts
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, platform, url }) => {
  if (!locals.user) throw error(401, 'Unauthorized');

  const key = params.key;
  if (!key) throw error(400, 'Missing key');

  // Verify ownership: key format is {type}/{userId}/{filename}
  const parts = key.split('/');
  if (parts.length < 3 || parts[1] !== locals.user.id) {
    throw error(403, 'Forbidden');
  }

  const env = platform!.env;
  const object = await env.R2.get(key);
  if (!object) throw error(404, 'Not found');

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType ?? 'image/png');
  headers.set('Cache-Control', 'private, max-age=3600');

  // Thumbnail support: ?w=300
  const width = url.searchParams.get('w');
  // Note: For thumbnail resizing, integrate Cloudflare Image Resizing or wsrv.nl
  // For now, return original image
  return new Response(object.body, { headers });
};
```

**Step 4: Commit**

```bash
git add src/routes/api/generate/ src/routes/api/upload/ src/routes/api/image/
git commit -m "feat: add generate, upload, and image proxy APIs"
```

---

## Task 14: API Routes — Checkout & Webhooks

**Files:**
- Create: `src/routes/api/checkout/+server.ts`
- Create: `src/routes/api/webhook/creem/+server.ts`
- Create: `src/routes/api/webhook/replicate/+server.ts`

**Step 1: Create checkout API**

```typescript
// src/routes/api/checkout/+server.ts
import { json, error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { RequestHandler } from './$types';

const PLANS: Record<string, { price: number; credits: number; creemProductId: string }> = {
  starter: { price: 900, credits: 100, creemProductId: 'prod_starter_id' },
  pro: { price: 2900, credits: 500, creemProductId: 'prod_pro_id' },
};

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!config.features.payments) throw error(400, 'Payments disabled');

  const plan = url.searchParams.get('plan');
  if (!plan || !(plan in PLANS)) throw error(400, 'Invalid plan');

  const env = platform!.env;
  const planConfig = PLANS[plan];

  // Create Creem checkout session
  const res = await fetch('https://api.creem.io/v1/checkouts', {
    method: 'POST',
    headers: {
      'x-api-key': env.CREEM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: planConfig.creemProductId,
      success_url: `${url.origin}/en/app/billing?status=success`,
      request_id: crypto.randomUUID(),
      metadata: {
        user_id: locals.user.id,
        plan,
        credits: planConfig.credits,
      },
    }),
  });

  const data = await res.json() as { checkout_url: string };
  throw redirect(302, data.checkout_url);
};
```

**Step 2: Create Creem webhook**

```typescript
// src/routes/api/webhook/creem/+server.ts
import { json, error } from '@sveltejs/kit';
import { createDb } from '$lib/server/db';
import { users, payments, creditLogs } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { sendAlert } from '$lib/server/alert';
import type { RequestHandler } from './$types';

async function verifyCreemSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === signature;
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform!.env;
  const body = await request.text();
  const signature = request.headers.get('creem-signature') ?? '';

  const valid = await verifyCreemSignature(body, signature, env.CREEM_WEBHOOK_SECRET);
  if (!valid) {
    platform!.context.waitUntil(
      sendAlert(env, 'Webhook Signature Failed', `Creem webhook signature verification failed`)
    );
    throw error(401, 'Invalid signature');
  }

  const payload = JSON.parse(body);
  if (payload.event !== 'checkout.completed') {
    return json({ ok: true });
  }

  const { user_id, plan, credits } = payload.object.metadata;
  const orderId = payload.object.id;

  const db = createDb(env.DB);

  // Idempotent: UNIQUE constraint on creem_order_id
  try {
    await db.batch([
      db.insert(payments).values({
        id: crypto.randomUUID(),
        userId: user_id,
        creemOrderId: orderId,
        type: plan,
        amount: payload.object.amount,
        currency: payload.object.currency,
        creditsAdded: credits,
        status: 'paid',
        createdAt: Date.now(),
      }),
      db.update(users)
        .set({ credits: sql`credits + ${credits}` })
        .where(eq(users.id, user_id)),
    ]);

    // Log credit addition
    const userRow = await db.select({ credits: users.credits })
      .from(users).where(eq(users.id, user_id)).get();
    await db.insert(creditLogs).values({
      id: crypto.randomUUID(),
      userId: user_id,
      amount: credits,
      balance: userRow!.credits!,
      type: 'purchase',
      refId: orderId,
      createdAt: Date.now(),
    });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE constraint failed')) {
      // Already processed, idempotent
      return json({ ok: true });
    }
    throw e;
  }

  return json({ ok: true });
};
```

**Step 3: Create Replicate webhook**

```typescript
// src/routes/api/webhook/replicate/+server.ts
import { json, error } from '@sveltejs/kit';
import { createDb } from '$lib/server/db';
import { generations, users, creditLogs } from '$lib/server/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { config } from '$lib/config';
import { sendAlert } from '$lib/server/alert';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform!.env;
  const payload = await request.json() as {
    id: string;
    status: 'succeeded' | 'failed' | 'canceled';
    output: string | string[] | null;
    error: string | null;
  };

  const db = createDb(env.DB);

  // Find generation by matching prediction (in production, store predictionId in generations table)
  // For now, search by status=processing (simplified)
  // TODO: Add predictionId column or use KV mapping

  if (payload.status === 'succeeded' && payload.output) {
    const imageUrl = Array.isArray(payload.output) ? payload.output[0] : payload.output;

    // Download image and store in R2
    const imgRes = await fetch(imageUrl);
    const imgData = await imgRes.arrayBuffer();

    // Find the generation (by prediction correlation)
    // This is simplified — in production, store predictionId in generations table
    const gen = await db.select()
      .from(generations)
      .where(eq(generations.status, 'processing'))
      .limit(1)
      .get();

    if (gen) {
      const r2Key = `generations/${gen.userId}/${gen.id}.png`;
      await env.R2.put(r2Key, imgData);
      await db.update(generations)
        .set({ status: 'done', resultUrl: r2Key })
        .where(eq(generations.id, gen.id));
    }
  } else if (payload.status === 'failed' || payload.status === 'canceled') {
    // Find and fail the generation, unfreeze credits
    const gen = await db.select()
      .from(generations)
      .where(eq(generations.status, 'processing'))
      .limit(1)
      .get();

    if (gen) {
      const cost = gen.creditsUsed ?? config.credits.costPerGeneration;
      await db.update(generations)
        .set({ status: 'failed', failureReason: payload.error ?? payload.status })
        .where(eq(generations.id, gen.id));

      if (config.features.credits) {
        await db.update(users)
          .set({ credits: sql`credits + ${cost}` })
          .where(eq(users.id, gen.userId));
        const userRow = await db.select({ credits: users.credits })
          .from(users).where(eq(users.id, gen.userId)).get();
        await db.insert(creditLogs).values({
          id: crypto.randomUUID(),
          userId: gen.userId,
          amount: cost,
          balance: userRow!.credits!,
          type: 'unfreeze',
          refId: gen.id,
          createdAt: Date.now(),
        });
      }

      platform!.context.waitUntil(
        sendAlert(env, 'AI Generation Failed', `Generation: ${gen.id}\nError: ${payload.error}`)
      );
    }
  }

  return json({ ok: true });
};
```

**Step 4: Commit**

```bash
git add src/routes/api/checkout/ src/routes/api/webhook/
git commit -m "feat: add checkout API and Creem/Replicate webhooks"
```

---

## Task 15: CI/CD & Final Configuration

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `package.json` (add scripts)

**Step 1: Create GitHub Actions workflow**

```yaml
# .github/workflows/deploy.yml
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

**Step 2: Add npm scripts to package.json**

Add these scripts:
```json
{
  "scripts": {
    "dev": "wrangler dev",
    "build": "vite build",
    "preview": "wrangler dev",
    "setup": "wrangler deploy && wrangler d1 migrations apply DB --remote",
    "db:generate": "drizzle-kit generate",
    "db:migrate:local": "wrangler d1 migrations apply DB --local",
    "db:migrate:remote": "wrangler d1 migrations apply DB --remote",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Step 3: Verify full build works**

```bash
npm run build
```

Expected: Build succeeds without errors.

**Step 4: Commit**

```bash
git add .github/ package.json
git commit -m "feat: add CI/CD workflow and npm scripts"
```

---

## Task 16: Smoke Test & Final Verification

**Step 1: Start local dev server**

```bash
npm run db:migrate:local
npm run dev
```

**Step 2: Verify routes**

- `http://localhost:8787/` → 301 redirect to `/en/`
- `http://localhost:8787/en/` → Landing page renders
- `http://localhost:8787/en/pricing` → Pricing page renders
- `http://localhost:8787/en/app` → Redirects to `/login` (no auth)
- `http://localhost:8787/api/generate?id=test` → 401 response

**Step 3: Verify build**

```bash
npm run build
```

Expected: Clean build, no TypeScript errors.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and verification"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Project scaffolding | package.json, svelte.config.js, wrangler.toml |
| 2 | Global types & config | app.d.ts, config.ts |
| 3 | Database schema | schema.ts, migrations/ |
| 4 | i18n system | i18n/index.ts, messages/*.ts |
| 5 | Auth (Lucia + Google) | auth/lucia.ts, login routes |
| 6 | Server hooks | hooks.server.ts |
| 7 | Alert system | alert.ts |
| 8 | AI provider | ai/types.ts, replicate.ts |
| 9 | Shared components | SEO, Toast, Turnstile |
| 10 | Layouts & landing | [lang] layout, landing page |
| 11 | App pages | generate, gallery, account, billing |
| 12 | Static pages | pricing, privacy, terms |
| 13 | APIs — generate/upload/image | api/ routes |
| 14 | APIs — checkout/webhooks | webhook routes |
| 15 | CI/CD | deploy.yml, npm scripts |
| 16 | Smoke test | Verification |
