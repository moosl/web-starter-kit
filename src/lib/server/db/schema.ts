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
