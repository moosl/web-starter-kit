import type { AIProvider, GenerateParams, GenerateResult } from '../types';

export function createMockProvider(): AIProvider {
	return {
		supportsWebhook: false,

		async generate(params: GenerateParams): Promise<GenerateResult> {
			// Simulate a short delay
			await new Promise((r) => setTimeout(r, 500));

			return {
				imageUrl: `https://placehold.co/1024x1024/png?text=${encodeURIComponent(params.prompt.slice(0, 30))}`,
				predictionId: `mock_${crypto.randomUUID()}`,
				model: 'mock',
				provider: 'mock',
			};
		},
	};
}
