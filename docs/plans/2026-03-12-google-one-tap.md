# Google One Tap Login Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Google One Tap prompt on the homepage so users can sign in without leaving the page.

**Architecture:** Load Google Identity Services (GIS) client SDK on pages where user is not logged in. Google returns a JWT credential token on tap. A new server endpoint `/api/auth/google-one-tap` verifies the JWT, finds-or-creates the user (reusing existing OAuth callback logic), creates a session, and sets the cookie. The browser then reloads to reflect the logged-in state.

**Tech Stack:** Google Identity Services (`accounts.google.com/gsi/client`), SvelteKit, existing session/auth utilities.

---

### Task 1: Add `PUBLIC_GOOGLE_CLIENT_ID` to environment config

**Files:**
- Modify: `.env.example`
- Modify: `.env` (local, not committed)

**Step 1: Add the var to `.env.example`**

Add under the Turnstile section:

```
# --- Google One Tap (feature flag: auth) ---
# Same Client ID as server-side OAuth. Get from Google Cloud Console > Credentials.
PUBLIC_GOOGLE_CLIENT_ID=
```

**Step 2: Add the actual value to local `.env`**

```
PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
```

This is the same value as `GOOGLE_CLIENT_ID` in `.dev.vars` — it's a public identifier, not a secret.

**Step 3: Commit**

```bash
git add .env.example
git commit -m "feat: add PUBLIC_GOOGLE_CLIENT_ID env var for One Tap"
```

---

### Task 2: Create the Google One Tap verification endpoint

**Files:**
- Create: `src/routes/api/auth/google-one-tap/+server.ts`

**Step 1: Write the endpoint**

This endpoint receives the `credential` JWT from Google's client SDK, verifies it, finds or creates the user (same logic as the OAuth callback), creates a session, and returns JSON.

```ts
import { json, error } from '@sveltejs/kit';
import {
	generateSessionToken,
	createSession,
	SESSION_COOKIE,
	sessionCookieOptions,
} from '$lib/server/auth/session';
import { createDb } from '$lib/server/db';
import { users, oauthAccounts } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { config } from '$lib/config';
import type { RequestHandler } from './$types';

interface GoogleJwtPayload {
	iss: string;
	sub: string;
	email: string;
	name: string;
	picture: string;
	aud: string;
	exp: number;
}

function decodeJwtPayload(token: string): GoogleJwtPayload {
	const parts = token.split('.');
	if (parts.length !== 3) throw new Error('Invalid JWT');
	const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
	return payload;
}

async function verifyGoogleToken(credential: string, clientId: string): Promise<GoogleJwtPayload> {
	// Fetch Google's public keys
	const certsRes = await fetch('https://www.googleapis.com/oauth2/v3/certs');
	const certs = await certsRes.json();

	// Decode header to find the key
	const headerB64 = credential.split('.')[0];
	const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
	const key = certs.keys.find((k: any) => k.kid === header.kid);
	if (!key) throw new Error('Key not found');

	// Import the public key and verify
	const cryptoKey = await crypto.subtle.importKey(
		'jwk',
		key,
		{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
		false,
		['verify'],
	);

	const [headerPart, payloadPart, signaturePart] = credential.split('.');
	const data = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
	const signature = Uint8Array.from(atob(signaturePart.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

	const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, data);
	if (!valid) throw new Error('Invalid signature');

	const payload = decodeJwtPayload(credential);

	// Verify claims
	if (payload.aud !== clientId) throw new Error('Invalid audience');
	if (payload.exp * 1000 < Date.now()) throw new Error('Token expired');
	if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
		throw new Error('Invalid issuer');
	}

	return payload;
}

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
	if (!config.features.auth) throw error(404);

	const env = platform!.env;
	const { credential } = await request.json();
	if (!credential) throw error(400, 'Missing credential');

	let googleUser: GoogleJwtPayload;
	try {
		googleUser = await verifyGoogleToken(credential, env.GOOGLE_CLIENT_ID);
	} catch (e) {
		throw error(401, 'Invalid Google credential');
	}

	const db = createDb(env.DB);

	// Find or create user — same logic as OAuth callback
	const existingAccount = await db
		.select()
		.from(oauthAccounts)
		.where(
			and(
				eq(oauthAccounts.providerId, 'google'),
				eq(oauthAccounts.providerUserId, googleUser.sub),
			),
		)
		.get();

	let userId: string;

	if (existingAccount) {
		userId = existingAccount.userId;
	} else {
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

	const token = generateSessionToken();
	const session = await createSession(env.DB, token, userId);

	cookies.set(SESSION_COOKIE, token, sessionCookieOptions(session.expiresAt));

	const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
	await env.KV.put(
		`session:${session.id}`,
		JSON.stringify({
			userId,
			expiresAt: session.expiresAt.getTime(),
		}),
		{ expirationTtl: ttl },
	);

	return json({ success: true });
};
```

**Step 2: Commit**

```bash
git add src/routes/api/auth/google-one-tap/+server.ts
git commit -m "feat: add Google One Tap verification endpoint"
```

---

### Task 3: Create the GoogleOneTap component

**Files:**
- Create: `src/lib/components/GoogleOneTap.svelte`

**Step 1: Write the component**

The component loads the GIS script, initializes One Tap, and handles the callback. It follows the same pattern as `Turnstile.svelte` (dynamic script load in `onMount`).

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { config } from '$lib/config';

	let clientId = '';

	onMount(async () => {
		if (!config.features.auth) return;

		const mod = await import('$env/static/public');
		clientId = (mod as any).PUBLIC_GOOGLE_CLIENT_ID ?? '';
		if (!clientId) return;

		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.onload = () => {
			(window as any).google.accounts.id.initialize({
				client_id: clientId,
				callback: handleCredentialResponse,
				auto_select: true,
				cancel_on_tap_outside: false,
			});
			(window as any).google.accounts.id.prompt();
		};
		document.head.appendChild(script);
	});

	async function handleCredentialResponse(response: { credential: string }) {
		const res = await fetch('/api/auth/google-one-tap', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ credential: response.credential }),
		});

		if (res.ok) {
			window.location.reload();
		}
	}
</script>
```

**Step 2: Commit**

```bash
git add src/lib/components/GoogleOneTap.svelte
git commit -m "feat: add GoogleOneTap component"
```

---

### Task 4: Add the component to the layout (show when not logged in)

**Files:**
- Modify: `src/routes/[lang]/+layout.svelte`

**Step 1: Import and render**

Add the import at the top of the `<script>` block:

```ts
import GoogleOneTap from '$lib/components/GoogleOneTap.svelte';
```

Add the component right before the closing `</div>` of the outer wrapper (after `<Toast />`), only when the user is NOT logged in:

```svelte
{#if !data.user && config.features.auth}
	<GoogleOneTap />
{/if}
```

**Step 2: Commit**

```bash
git add src/routes/[lang]/+layout.svelte
git commit -m "feat: show Google One Tap prompt for unauthenticated users"
```

---

### Task 5: Update CSP to allow Google Identity Services

**Files:**
- Modify: `src/hooks.server.ts`

**Step 1: Update Content-Security-Policy**

The current CSP needs to allow:
- `script-src`: `https://accounts.google.com`
- `connect-src`: `https://accounts.google.com`
- `frame-src`: `https://accounts.google.com`
- `style-src`: `https://accounts.google.com` (GIS injects inline styles)

Update the CSP string in `handleSecurityHeaders`:

```ts
response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://accounts.google.com; img-src 'self' blob: data: https://*.r2.cloudflarestorage.com https://*.googleusercontent.com; connect-src 'self' https://accounts.google.com https://*.google-analytics.com https://*.r2.cloudflarestorage.com; frame-src https://accounts.google.com https://challenges.cloudflare.com",
);
```

**Step 2: Commit**

```bash
git add src/hooks.server.ts
git commit -m "feat: update CSP to allow Google Identity Services"
```

---

### Task 6: Update docs

**Files:**
- Modify: `README.md` — add `PUBLIC_GOOGLE_CLIENT_ID` to the Google OAuth section and key table
- Modify: `CLAUDE.md` — mention One Tap in Auth section

**Step 1: Update README**

In the Google OAuth section, after step 12 (filling `.dev.vars`), add:

```markdown
13. 把同样的 Client ID 填入 `.env`（用于浏览器端 One Tap 登录）：
    ```
    PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
    ```
```

In the key table, update the "用户登录" row:

```
| 用户登录 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PUBLIC_GOOGLE_CLIENT_ID` (same value as CLIENT_ID) | `auth` | 推荐 |
```

**Step 2: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: add Google One Tap setup instructions"
```

---

### Task 7: Test locally

**Step 1: Verify `.env` has the client ID**

```
PUBLIC_GOOGLE_CLIENT_ID=<your-id>.apps.googleusercontent.com
```

**Step 2: Run dev server**

```bash
npm run dev
```

**Step 3: Open homepage in incognito**

- Visit `http://localhost:5173`
- Google One Tap prompt should appear in the top-right corner
- Click to sign in
- Page should reload and show you as logged in

**Step 4: Verify second visit doesn't show prompt**

- Refresh the page while logged in
- One Tap should NOT appear (component only renders when `!data.user`)

---

## Notes

- **GOOGLE_CLIENT_ID** (in `.dev.vars`) = server secret used for OAuth code exchange
- **PUBLIC_GOOGLE_CLIENT_ID** (in `.env`) = same value, exposed to browser for GIS SDK
- They're the same value, but live in different files because of the SvelteKit `$env/static/public` convention
- Google One Tap requires HTTPS in production; `localhost` works for dev
- The One Tap prompt respects Google's "cooldown" — if a user dismisses it, Google won't show it again for a while
