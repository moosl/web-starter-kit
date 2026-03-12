import { config } from '$lib/config';
import { createReplicateProvider } from './providers/replicate';
import { createMockProvider } from './providers/mock';
import type { AIProvider } from './types';

export function createAIProvider(env: App.Platform['env']): AIProvider {
	switch (config.ai.provider) {
		case 'replicate':
			return createReplicateProvider(env.REPLICATE_API_TOKEN);
		case 'mock':
			return createMockProvider();
		default:
			throw new Error(`Unknown AI provider: ${config.ai.provider}`);
	}
}

export type { AIProvider, GenerateParams, GenerateResult } from './types';
