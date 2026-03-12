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

	const result = await db
		.select()
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

	let fresh = false;
	if (Date.now() >= session.expiresAt - REFRESH_THRESHOLD) {
		const newExpiry = Date.now() + SESSION_DURATION;
		await db.update(sessions).set({ expiresAt: newExpiry }).where(eq(sessions.id, sessionId));
		session.expiresAt = newExpiry;
		fresh = true;
	}

	return {
		session: {
			id: session.id,
			userId: session.userId,
			expiresAt: new Date(session.expiresAt),
			fresh,
		},
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
