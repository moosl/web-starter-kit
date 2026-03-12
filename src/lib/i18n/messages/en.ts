export const en = {
	landing: {
		title: 'AI Image Generator',
		subtitle: 'Create stunning images with AI',
		cta: 'Get Started',
	},
	nav: {
		home: 'Home',
		pricing: 'Pricing',
		login: 'Login',
		app: 'Dashboard',
		gallery: 'Gallery',
		account: 'Account',
		logout: 'Logout',
	},
	auth: {
		loginWithGoogle: 'Sign in with Google',
		loginRequired: 'Please sign in to continue',
	},
	app: {
		promptPlaceholder: 'Describe the image you want to create...',
		generate: 'Generate',
		generating: 'Generating...',
		credits: 'Credits',
		noCredits: 'No credits remaining',
		uploadRef: 'Upload reference image',
	},
	gallery: {
		title: 'My Gallery',
		empty: 'No images yet. Create your first one!',
		status: {
			pending: 'Processing',
			done: 'Complete',
			failed: 'Failed',
		},
	},
	account: {
		title: 'Account',
		plan: 'Plan',
		credits: 'Credits',
		syncOrders: 'Sync Orders',
	},
	pricing: {
		title: 'Pricing',
		free: 'Free',
		freeDesc: '10 credits to start',
		starter: 'Starter',
		starterDesc: '100 credits',
		pro: 'Pro',
		proDesc: '500 credits',
		buy: 'Buy Now',
	},
	billing: {
		success: 'Payment successful! Credits added.',
		cancelled: 'Payment cancelled.',
	},
	errors: {
		notFound: 'Page not found',
		serverError: 'Something went wrong',
		tryAgain: 'Try again',
		goHome: 'Go home',
	},
	footer: {
		privacy: 'Privacy Policy',
		terms: 'Terms of Service',
	},
	seo: {
		landing: {
			description:
				'Create stunning AI-generated images in seconds. Powered by Flux 1.1 Pro with a simple credit-based system. Try free today.',
		},
		pricing: {
			description:
				'Choose a plan that fits your needs. Start free with 10 credits or upgrade for more AI image generations.',
		},
		privacy: {
			title: 'Privacy Policy',
			description: 'Learn how we collect, use, and protect your personal information.',
		},
		terms: {
			title: 'Terms of Service',
			description: 'Read the terms and conditions for using our AI image generation service.',
		},
	},
	privacy: {
		title: 'Privacy Policy',
		lastUpdated: 'Last updated: March 2026',
		sections: [
			{
				heading: 'Information We Collect',
				content:
					'We collect information you provide when creating an account via Google OAuth, including your name, email address, and profile picture. We also collect usage data such as images generated, credits consumed, and payment history.',
			},
			{
				heading: 'How We Use Your Information',
				content:
					'Your information is used to provide and improve our service, process payments, manage your account and credits, and communicate important updates. We do not sell your personal data to third parties.',
			},
			{
				heading: 'Data Storage and Security',
				content:
					'Your data is stored securely on Cloudflare infrastructure. Generated images are stored in encrypted object storage. Session data is hashed and expires after 30 days. We use industry-standard security measures to protect your information.',
			},
			{
				heading: 'Third-Party Services',
				content:
					'We use the following third-party services: Google OAuth for authentication, Replicate for AI image generation, Creem for payment processing, and Cloudflare for hosting and CDN. Each service has its own privacy policy.',
			},
			{
				heading: 'Your Rights',
				content:
					'You may request access to, correction of, or deletion of your personal data at any time by contacting us. You can also delete your account, which will remove your personal information and generated images.',
			},
			{
				heading: 'Contact',
				content:
					'If you have questions about this privacy policy, please contact us via the email address listed on our website.',
			},
		],
	},
	terms: {
		title: 'Terms of Service',
		lastUpdated: 'Last updated: March 2026',
		sections: [
			{
				heading: 'Acceptance of Terms',
				content:
					'By accessing or using this service, you agree to be bound by these terms. If you do not agree, please do not use the service.',
			},
			{
				heading: 'Account Responsibility',
				content:
					'You are responsible for maintaining the security of your account. You must not share your login credentials. You are liable for all activity under your account.',
			},
			{
				heading: 'Credits and Payments',
				content:
					'Credits are deducted when you generate an image. If generation fails, credits are automatically refunded. Purchased credits are non-refundable but do not expire. Prices are subject to change with reasonable notice.',
			},
			{
				heading: 'Acceptable Use',
				content:
					'You must not use the service to generate illegal, harmful, or infringing content. We reserve the right to suspend accounts that violate this policy without prior notice.',
			},
			{
				heading: 'Intellectual Property',
				content:
					'You retain ownership of images generated using our service. We do not claim rights over your generated content. The service itself, including its design and code, remains our intellectual property.',
			},
			{
				heading: 'Limitation of Liability',
				content:
					'The service is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.',
			},
			{
				heading: 'Changes to Terms',
				content:
					'We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms. We will notify users of significant changes via email.',
			},
		],
	},
};

export type Messages = typeof en;
