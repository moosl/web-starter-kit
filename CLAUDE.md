# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Local dev server (wrangler dev, Cloudflare Workers runtime)
npm run build            # Production build (vite build + adapter-cloudflare)
npm run check            # TypeScript + Svelte type checking
npm test                 # Run all tests (vitest run)
npm run test:watch       # Watch mode tests
npm run db:generate      # Generate migration from schema changes
npm run db:migrate:local # Apply migrations to local D1
npm run db:migrate:remote # Apply migrations to remote D1
```

Run a single test file: `npx vitest run src/lib/i18n/__tests__/i18n.test.ts`

## Architecture

**Runtime**: Cloudflare Workers (not Node.js). Uses D1 (SQLite), R2 (object storage), KV (cache). All async side-effects (R2 uploads, alert emails) go through `platform.context.waitUntil()`.

**Framework**: SvelteKit 2 + Svelte 5 (runes syntax). Adapter: `@sveltejs/adapter-cloudflare`.

**Feature flags** (`src/lib/config.ts`): Every major subsystem (auth, payments, credits, AI, turnstile, upload) is independently toggleable. All route handlers and hooks check these flags before executing.

### Request Flow

Hooks in `src/hooks.server.ts` run sequentially via `sequence()`:
1. **handleAuth** — validates session cookie, populates `event.locals.user`/`session`
2. **handleI18n** — enforces `/{locale}/` URL prefix, redirects bare URLs using Accept-Language detection
3. **handleProtectedRoutes** — guards `/[lang]/app/**`, redirects to `/login`
4. **handleSecurityHeaders** — CSP, X-Frame-Options, etc.

### Route Structure

- `/[lang]/` — public pages (landing, pricing, privacy, terms) with locale prefix
- `/[lang]/app/` — authenticated area (generate, gallery, account, billing)
- `/login/google/` — OAuth initiation + callback
- `/api/` — REST endpoints (generate status polling, upload presigned URLs, image proxy, checkout, webhooks)

### Auth

Session-based using `@oslojs/crypto` + `@oslojs/encoding`. Tokens are base32-encoded random bytes, stored as SHA-256 hashes in D1. 30-day TTL with 15-day auto-refresh. Google OAuth via `arctic` library. Google One Tap login (`/api/auth/google-one-tap`) verifies GIS JWT using Web Crypto API and Google's JWKS endpoint. Session cached in KV.

### Database

Drizzle ORM over D1 SQLite. Schema in `src/lib/server/db/schema.ts` (7 tables: users, sessions, oauthAccounts, generations, creditLogs, payments, errorLogs). Factory: `createDb(platform.env.DB)`.

### Credit System

Freeze-confirm model: credits are deducted on generation start, refunded on failure. All transactions logged in `creditLogs` with balance snapshots. Type field: `freeze`, `unfreeze`, `purchase`.

### AI Provider

Factory pattern in `src/lib/server/ai/`. Providers: `replicate` (Flux 1.1 Pro, sync + webhook modes) and `mock` (returns placeholder images, no API key needed). Set `config.ai.provider` in `src/lib/config.ts` to switch.

### Payments

Creem SDK (`creem` npm package). Checkout endpoint auto-detects test vs production based on API key prefix (`creem_test_*` → `test-api.creem.io`). Webhook payload uses `eventType` field (not `event`).

### i18n

URL-prefix routing with 4 locales (en, zh, ja, ko). Messages in `src/lib/i18n/messages/`. English is the source of truth — `Messages` type is derived from `en.ts`. All translation files must have identical key structure.

## Svelte 5 Conventions

This project uses **Svelte 5 runes** exclusively. Never use Svelte 4 syntax:
- `$props()` not `export let`
- `$derived()` not `$:`
- `$state()` for reactive state
- `$bindable()` for two-way binding
- `{@render children()}` not `<slot/>`

## Tests

Vitest, pattern `src/**/*.test.ts`. Tests live in `__tests__/` directories adjacent to the code they test. Current coverage: i18n, config, session utils, HMAC verification, DB schema, AI provider.

## Environment

Secrets go in `.dev.vars` (local) — see `.dev.vars.example`. Public env vars in `.env` — see `.env.example`. Never import from `$env/static/private` at module top level in client code.

Alert email is set via `ALERT_EMAIL` env var in `.dev.vars`. Creem product IDs are public config in `config.ts` (`plans.starter.creemProductId`, `plans.pro.creemProductId`).

### SEO

Reusable `SEO.svelte` component handles canonical URLs, Open Graph, Twitter Cards, hreflang alternates, and optional JSON-LD. Site metadata (`url`, `name`) in `config.ts`. Dynamic `sitemap.xml` and `robots.txt` via server routes. `<html lang>` is set dynamically via `transformPageChunk` in hooks.

### Deploy

`npm run deploy` runs `scripts/deploy.sh`: creates D1/R2/KV resources, auto-fills `wrangler.toml` IDs, reads secrets from `.dev.vars`, migrates DB, and deploys. `wrangler.toml` ships without hardcoded resource IDs — the script fills them per-account.
