import { describe, it, expect } from 'vitest';
import { generateSessionToken, SESSION_COOKIE, sessionCookieOptions } from '../session';

describe('session utilities', () => {
	describe('generateSessionToken', () => {
		it('returns a non-empty string', () => {
			const token = generateSessionToken();
			expect(token).toBeTruthy();
			expect(typeof token).toBe('string');
			expect(token.length).toBeGreaterThan(0);
		});

		it('returns base32 encoded string (lowercase, no padding)', () => {
			const token = generateSessionToken();
			expect(token).toMatch(/^[a-z2-7]+$/);
		});

		it('generates unique tokens', () => {
			const tokens = new Set(Array.from({ length: 100 }, () => generateSessionToken()));
			expect(tokens.size).toBe(100);
		});

		it('generates tokens of consistent length', () => {
			const lengths = Array.from({ length: 20 }, () => generateSessionToken().length);
			expect(new Set(lengths).size).toBe(1);
		});
	});

	describe('SESSION_COOKIE', () => {
		it('is "session"', () => {
			expect(SESSION_COOKIE).toBe('session');
		});
	});

	describe('sessionCookieOptions', () => {
		it('returns correct cookie options', () => {
			const date = new Date('2025-01-01T00:00:00Z');
			const opts = sessionCookieOptions(date);
			expect(opts.httpOnly).toBe(true);
			expect(opts.sameSite).toBe('lax');
			expect(opts.expires).toBe(date);
			expect(opts.path).toBe('/');
			expect(opts.secure).toBe(true);
		});

		it('uses the provided expiry date', () => {
			const future = new Date(Date.now() + 86400000);
			const opts = sessionCookieOptions(future);
			expect(opts.expires).toBe(future);
		});
	});
});
