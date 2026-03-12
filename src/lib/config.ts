export const config = {
	features: {
		auth: false,
		payments: false,
		credits: false,
		ai: false,
		turnstile: false,
		upload: false,
	},
	ai: {
		provider: 'replicate' as const,
		defaultModel: 'flux-1.1-pro',
	},
	credits: {
		costPerGeneration: 1,
		freeOnSignup: 10,
	},
	upload: {
		maxSizeMB: 10,
		allowedTypes: ['jpg', 'png', 'webp'] as const,
	},
	alert: {
		email: '',
		maxPerHour: 10,
	},
	analytics: {
		cloudflareWebAnalytics: '',
		googleAnalytics: '',
	},
	i18n: {
		defaultLocale: 'en' as const,
		locales: ['en', 'zh', 'ja', 'ko'] as const,
	},
};
