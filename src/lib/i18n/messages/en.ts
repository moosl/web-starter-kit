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
};

export type Messages = typeof en;
