import { json } from '@sveltejs/kit';
import { createDb } from '$lib/server/db';
import { generations, users, creditLogs } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { config } from '$lib/config';
import { sendAlert } from '$lib/server/alert';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform!.env;
	const payload = (await request.json()) as {
		id: string;
		status: 'succeeded' | 'failed' | 'canceled';
		output: string | string[] | null;
		error: string | null;
	};

	const db = createDb(env.DB);

	if (payload.status === 'succeeded' && payload.output) {
		const imageUrl = Array.isArray(payload.output) ? payload.output[0] : payload.output;

		const imgRes = await fetch(imageUrl);
		const imgData = await imgRes.arrayBuffer();

		const gen = await db
			.select()
			.from(generations)
			.where(eq(generations.status, 'processing'))
			.limit(1)
			.get();

		if (gen) {
			const r2Key = `generations/${gen.userId}/${gen.id}.png`;
			await env.R2.put(r2Key, imgData);
			await db
				.update(generations)
				.set({ status: 'done', resultUrl: r2Key })
				.where(eq(generations.id, gen.id));
		}
	} else if (payload.status === 'failed' || payload.status === 'canceled') {
		const gen = await db
			.select()
			.from(generations)
			.where(eq(generations.status, 'processing'))
			.limit(1)
			.get();

		if (gen) {
			const cost = gen.creditsUsed ?? config.credits.costPerGeneration;
			await db
				.update(generations)
				.set({ status: 'failed', failureReason: payload.error ?? payload.status })
				.where(eq(generations.id, gen.id));

			if (config.features.credits) {
				await db
					.update(users)
					.set({ credits: sql`credits + ${cost}` })
					.where(eq(users.id, gen.userId));
				const userRow = await db
					.select({ credits: users.credits })
					.from(users)
					.where(eq(users.id, gen.userId))
					.get();
				await db.insert(creditLogs).values({
					id: crypto.randomUUID(),
					userId: gen.userId,
					amount: cost,
					balance: userRow!.credits!,
					type: 'unfreeze',
					refId: gen.id,
					createdAt: Date.now(),
				});
			}

			platform!.context.waitUntil(
				sendAlert(
					env,
					'AI Generation Failed',
					`Generation: ${gen.id}\nError: ${payload.error}`,
				),
			);
		}
	}

	return json({ ok: true });
};
