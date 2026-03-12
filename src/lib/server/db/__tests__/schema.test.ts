import { describe, it, expect } from 'vitest';
import { users, sessions, oauthAccounts, generations, creditLogs, payments, errorLogs } from '../schema';
import { getTableName } from 'drizzle-orm';

describe('Database Schema', () => {
	describe('table names', () => {
		it('users table exists', () => {
			expect(getTableName(users)).toBe('users');
		});

		it('sessions table exists', () => {
			expect(getTableName(sessions)).toBe('sessions');
		});

		it('oauth_accounts table exists', () => {
			expect(getTableName(oauthAccounts)).toBe('oauth_accounts');
		});

		it('generations table exists', () => {
			expect(getTableName(generations)).toBe('generations');
		});

		it('credit_logs table exists', () => {
			expect(getTableName(creditLogs)).toBe('credit_logs');
		});

		it('payments table exists', () => {
			expect(getTableName(payments)).toBe('payments');
		});

		it('error_logs table exists', () => {
			expect(getTableName(errorLogs)).toBe('error_logs');
		});
	});

	describe('users columns', () => {
		it('has all required columns', () => {
			const cols = users as any;
			expect(cols.id).toBeDefined();
			expect(cols.email).toBeDefined();
			expect(cols.name).toBeDefined();
			expect(cols.avatarUrl).toBeDefined();
			expect(cols.credits).toBeDefined();
			expect(cols.plan).toBeDefined();
			expect(cols.createdAt).toBeDefined();
			expect(cols.deletedAt).toBeDefined();
		});
	});

	describe('sessions columns', () => {
		it('has all required columns', () => {
			const cols = sessions as any;
			expect(cols.id).toBeDefined();
			expect(cols.userId).toBeDefined();
			expect(cols.expiresAt).toBeDefined();
		});
	});

	describe('generations columns', () => {
		it('has all required columns', () => {
			const cols = generations as any;
			expect(cols.id).toBeDefined();
			expect(cols.userId).toBeDefined();
			expect(cols.prompt).toBeDefined();
			expect(cols.refImageUrl).toBeDefined();
			expect(cols.resultUrl).toBeDefined();
			expect(cols.status).toBeDefined();
			expect(cols.failureReason).toBeDefined();
			expect(cols.provider).toBeDefined();
			expect(cols.model).toBeDefined();
			expect(cols.creditsUsed).toBeDefined();
			expect(cols.createdAt).toBeDefined();
			expect(cols.deletedAt).toBeDefined();
		});
	});

	describe('payments columns', () => {
		it('has all required columns', () => {
			const cols = payments as any;
			expect(cols.id).toBeDefined();
			expect(cols.userId).toBeDefined();
			expect(cols.creemOrderId).toBeDefined();
			expect(cols.type).toBeDefined();
			expect(cols.amount).toBeDefined();
			expect(cols.currency).toBeDefined();
			expect(cols.creditsAdded).toBeDefined();
			expect(cols.status).toBeDefined();
			expect(cols.createdAt).toBeDefined();
		});
	});

	describe('creditLogs columns', () => {
		it('has all required columns', () => {
			const cols = creditLogs as any;
			expect(cols.id).toBeDefined();
			expect(cols.userId).toBeDefined();
			expect(cols.amount).toBeDefined();
			expect(cols.balance).toBeDefined();
			expect(cols.type).toBeDefined();
			expect(cols.refId).toBeDefined();
			expect(cols.createdAt).toBeDefined();
		});
	});

	describe('errorLogs columns', () => {
		it('has all required columns', () => {
			const cols = errorLogs as any;
			expect(cols.id).toBeDefined();
			expect(cols.type).toBeDefined();
			expect(cols.message).toBeDefined();
			expect(cols.url).toBeDefined();
			expect(cols.createdAt).toBeDefined();
		});
	});

	describe('table count', () => {
		it('exports exactly 7 tables', () => {
			const tables = [users, sessions, oauthAccounts, generations, creditLogs, payments, errorLogs];
			expect(tables.length).toBe(7);
			for (const table of tables) {
				expect(table).toBeDefined();
			}
		});
	});
});
