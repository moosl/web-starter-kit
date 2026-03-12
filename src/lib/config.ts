export const config = {
	// Site metadata — used for sitemap, canonical URLs, OG tags
	site: {
		url: 'https://yourdomain.com', // Base URL (no trailing slash)
		name: 'AI Image Generator',
	},
	// Toggle features on/off. Set to false if the required API keys are not configured.
	features: {
		auth: true, // Google OAuth login — requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
		payments: true, // Creem checkout — requires CREEM_API_KEY, CREEM_WEBHOOK_SECRET
		credits: true, // Credit-based usage system — no API keys needed
		ai: true, // AI image generation — requires REPLICATE_API_TOKEN
		turnstile: true, // Cloudflare Turnstile bot protection — requires TURNSTILE_SECRET_KEY
		upload: true, // R2 presigned file uploads — requires R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT
	},
	// AI provider settings
	ai: {
		provider: 'mock' as const, // AI provider: 'replicate' for production, 'mock' for testing without API key
		defaultModel: 'flux-1.1-pro', // Model used for image generation
	},
	// Pricing plans — each plan maps to a Creem product
	plans: {
		starter: {
			price: 900, // Price in cents ($9.00)
			credits: 100, // Credits included in this plan
		},
		pro: {
			price: 2900, // Price in cents ($29.00)
			credits: 500, // Credits included in this plan
		},
	},
	// Credit system settings
	credits: {
		costPerGeneration: 1, // Credits consumed per image generation
		freeOnSignup: 10, // Credits granted to new users on registration
	},
	// File upload constraints
	upload: {
		maxSizeMB: 10, // Maximum upload file size in megabytes
		allowedTypes: ['jpg', 'png', 'webp'] as const, // Accepted image formats
	},
	// Error alert emails via Resend
	alert: {
		email: '', // Set via ALERT_EMAIL env var; leave empty to disable
		maxPerHour: 10, // Rate limit: max alert emails per hour (stored in KV)
	},
	// Analytics tracking IDs (leave empty to disable)
	analytics: {
		cloudflareWebAnalytics: '', // Cloudflare Web Analytics token
		googleAnalytics: '', // Google Analytics 4 measurement ID (e.g. G-XXXXXXXXXX)
	},
	// Internationalization settings
	i18n: {
		defaultLocale: 'en' as const, // Fallback locale when none is detected
		locales: ['en', 'zh', 'ja', 'ko'] as const, // Supported locales (URL prefix routing)
	},
};
