import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';
import { Creem } from 'creem';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals, platform }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (!config.features.payments) throw error(400, 'Payments disabled');

	const plan = url.searchParams.get('plan');
	if (!plan || !(plan in config.plans)) throw error(400, 'Invalid plan');

	const env = platform!.env;
	const planConfig = config.plans[plan as keyof typeof config.plans];

	// serverIdx: 0 = production, 1 = test (auto-detect from API key prefix)
	const creem = new Creem({
		apiKey: env.CREEM_API_KEY,
		serverIdx: env.CREEM_API_KEY.startsWith('creem_test_') ? 1 : 0,
	});

	try {
		const checkout = await creem.checkouts.create({
			productId: planConfig.creemProductId,
			successUrl: `${url.origin}/en/app/billing?status=success`,
			requestId: crypto.randomUUID(),
			metadata: {
				user_id: locals.user.id,
				plan,
				credits: String(planConfig.credits),
			},
		});

		if (!checkout.checkoutUrl) {
			console.error('Creem response missing checkoutUrl:', checkout);
			throw error(500, 'Checkout failed: no checkout URL returned');
		}

		throw redirect(302, checkout.checkoutUrl);
	} catch (err: any) {
		// Re-throw SvelteKit redirects and errors
		if (err?.status && err?.location) throw err;
		if (err?.status && err?.body) throw err;

		console.error('Creem checkout error:', err);
		throw error(500, `Checkout failed: ${err.message || String(err)}`);
	}
};
