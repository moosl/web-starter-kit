import Replicate from 'replicate';
import type { AIProvider, GenerateParams, GenerateResult } from '../types';

export function createReplicateProvider(apiToken: string): AIProvider {
	const replicate = new Replicate({ auth: apiToken });

	return {
		supportsWebhook: true,

		async generate(params: GenerateParams): Promise<GenerateResult> {
			const model = params.model ?? 'black-forest-labs/flux-1.1-pro';
			const input: Record<string, any> = { prompt: params.prompt };

			if (params.refImageUrl) {
				input.image = params.refImageUrl;
			}

			if (params.webhookUrl) {
				const prediction = await replicate.predictions.create({
					model,
					input,
					webhook: params.webhookUrl,
					webhook_events_filter: ['completed'],
				});

				return {
					imageUrl: '',
					predictionId: prediction.id,
					model,
					provider: 'replicate',
				};
			}

			const output = await replicate.run(model as `${string}/${string}`, { input });
			const imageUrl = Array.isArray(output) ? output[0] : String(output);

			return {
				imageUrl,
				predictionId: '',
				model,
				provider: 'replicate',
			};
		},
	};
}
