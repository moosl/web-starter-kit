export interface GenerateParams {
	prompt: string;
	refImageUrl?: string;
	model?: string;
	webhookUrl?: string;
}

export interface GenerateResult {
	imageUrl: string;
	predictionId: string;
	model: string;
	provider: string;
}

export interface AIProvider {
	supportsWebhook: boolean;
	generate(params: GenerateParams): Promise<GenerateResult>;
}
