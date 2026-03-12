import { json, error } from '@sveltejs/kit';
import { createDb } from '$lib/server/db';
import { users, payments, creditLogs } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { sendAlert } from '$lib/server/alert';
import type { RequestHandler } from './$types';

async function verifyCreemSignature(
	body: string,
	signature: string,
	secret: string,
): Promise<boolean> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
	const expected = Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return expected === signature;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform!.env;
	const body = await request.text();
	const signature = request.headers.get('creem-signature') ?? '';

	const valid = await verifyCreemSignature(body, signature, env.CREEM_WEBHOOK_SECRET);
	if (!valid) {
		platform!.context.waitUntil(
			sendAlert(env, 'Webhook Signature Failed', 'Creem webhook signature verification failed'),
		);
		throw error(401, 'Invalid signature');
	}

	const payload = JSON.parse(body);
	console.log('Creem webhook received:', JSON.stringify(payload, null, 2));

	if (payload.eventType !== 'checkout.completed') {
		return json({ ok: true });
	}

	const checkout = payload.object;
	const { user_id, plan, credits } = checkout.metadata;
	const orderId = checkout.order?.id ?? checkout.id;

	const db = createDb(env.DB);

	try {
		await db.batch([
			db.insert(payments).values({
				id: crypto.randomUUID(),
				userId: user_id,
				creemOrderId: orderId,
				type: plan,
				amount: checkout.order?.amount ?? checkout.amount ?? 0,
				currency: checkout.order?.currency ?? checkout.currency ?? 'USD',
				creditsAdded: credits,
				status: 'paid',
				createdAt: Date.now(),
			}),
			db
				.update(users)
				.set({ credits: sql`credits + ${credits}` })
				.where(eq(users.id, user_id)),
		]);

		const userRow = await db
			.select({ credits: users.credits })
			.from(users)
			.where(eq(users.id, user_id))
			.get();
		await db.insert(creditLogs).values({
			id: crypto.randomUUID(),
			userId: user_id,
			amount: credits,
			balance: userRow!.credits!,
			type: 'purchase',
			refId: orderId,
			createdAt: Date.now(),
		});
	} catch (e: any) {
		if (e.message?.includes('UNIQUE constraint failed')) {
			return json({ ok: true });
		}
		throw e;
	}

	return json({ ok: true });
};
