import { describe, it, expect } from 'vitest';
import { createReplicateProvider } from '../providers/replicate';

describe('AI Provider', () => {
	describe('createReplicateProvider', () => {
		it('returns an AIProvider with supportsWebhook=true', () => {
			const provider = createReplicateProvider('test-token');
			expect(provider.supportsWebhook).toBe(true);
			expect(typeof provider.generate).toBe('function');
		});
	});

	describe('AIProvider interface shape', () => {
		it('has the expected methods', () => {
			const provider = createReplicateProvider('test');
			expect(provider).toHaveProperty('supportsWebhook');
			expect(provider).toHaveProperty('generate');
		});
	});
});
