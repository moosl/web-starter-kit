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
	const signature = Uint8Array.from(
		atob(signaturePart.replace(/-/g, '+').replace(/_/g, '/')),
		(c) => c.charCodeAt(0),
	);

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
