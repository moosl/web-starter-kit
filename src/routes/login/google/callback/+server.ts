import { redirect, error } from '@sveltejs/kit';
import { createGoogleOAuth } from '$lib/server/auth/google';
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
		`${url.origin}/login/google/callback`,
	);

	const tokens = await google.validateAuthorizationCode(code, codeVerifier);
	const accessToken = tokens.accessToken();

	const googleUserRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	const googleUser = (await googleUserRes.json()) as {
		sub: string;
		email: string;
		name: string;
		picture: string;
	};

	const db = createDb(env.DB);

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

	throw redirect(302, '/en/app');
};
