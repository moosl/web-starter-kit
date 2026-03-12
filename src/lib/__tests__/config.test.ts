import { describe, it, expect } from 'vitest';
import { config } from '../config';

describe('config', () => {
	describe('features', () => {
		it('has all expected feature flags', () => {
			expect(config.features).toHaveProperty('auth');
			expect(config.features).toHaveProperty('payments');
			expect(config.features).toHaveProperty('credits');
			expect(config.features).toHaveProperty('ai');
			expect(config.features).toHaveProperty('turnstile');
			expect(config.features).toHaveProperty('upload');
		});

		it('all feature flags are boolean', () => {
			for (const [key, value] of Object.entries(config.features)) {
				expect(typeof value, `features.${key} should be boolean`).toBe('boolean');
			}
		});
	});

	describe('ai', () => {
		it('has provider and defaultModel', () => {
			expect(['replicate', 'mock']).toContain(config.ai.provider);
			expect(config.ai.defaultModel).toBe('flux-1.1-pro');
		});
	});

	describe('credits', () => {
		it('has valid cost and signup bonus', () => {
			expect(config.credits.costPerGeneration).toBeGreaterThan(0);
			expect(config.credits.freeOnSignup).toBeGreaterThan(0);
			expect(config.credits.freeOnSignup).toBeGreaterThanOrEqual(config.credits.costPerGeneration);
		});
	});

	describe('upload', () => {
		it('has reasonable max size', () => {
			expect(config.upload.maxSizeMB).toBeGreaterThan(0);
			expect(config.upload.maxSizeMB).toBeLessThanOrEqual(100);
		});

		it('has allowed types', () => {
			expect(config.upload.allowedTypes.length).toBeGreaterThan(0);
			expect(config.upload.allowedTypes).toContain('jpg');
			expect(config.upload.allowedTypes).toContain('png');
			expect(config.upload.allowedTypes).toContain('webp');
		});
	});

	describe('alert', () => {
		it('has maxPerHour limit', () => {
			expect(config.alert.maxPerHour).toBeGreaterThan(0);
		});
	});

	describe('i18n', () => {
		it('has default locale', () => {
			expect(config.i18n.defaultLocale).toBe('en');
		});

		it('has supported locales including default', () => {
			expect(config.i18n.locales).toContain(config.i18n.defaultLocale);
			expect(config.i18n.locales.length).toBeGreaterThanOrEqual(2);
		});

		it('locales are lowercase 2-letter codes', () => {
			for (const locale of config.i18n.locales) {
				expect(locale).toMatch(/^[a-z]{2}$/);
			}
		});
	});
});
