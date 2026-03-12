import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { RequestHandler } from './$types';

const PLANS: Record<string, { price: number; credits: number; creemProductId: string }> = {
	starter: { price: 900, credits: 100, creemProductId: 'prod_starter_id' },
	pro: { price: 2900, credits: 500, creemProductId: 'prod_pro_id' },
};

export const GET: RequestHandler = async ({ url, locals, platform }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (!config.features.payments) throw error(400, 'Payments disabled');

	const plan = url.searchParams.get('plan');
	if (!plan || !(plan in PLANS)) throw error(400, 'Invalid plan');

	const env = platform!.env;
	const planConfig = PLANS[plan];

	const res = await fetch('https://api.creem.io/v1/checkouts', {
		method: 'POST',
		headers: {
			'x-api-key': env.CREEM_API_KEY,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			product_id: planConfig.creemProductId,
			success_url: `${url.origin}/en/app/billing?status=success`,
			request_id: crypto.randomUUID(),
			metadata: {
				user_id: locals.user.id,
				plan,
				credits: planConfig.credits,
			},
		}),
	});

	const data = (await res.json()) as { checkout_url: string };
	throw redirect(302, data.checkout_url);
};
