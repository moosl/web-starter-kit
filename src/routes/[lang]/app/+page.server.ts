import { fail } from '@sveltejs/kit';
import { config } from '$lib/config';
import { createDb } from '$lib/server/db';
import { generations, creditLogs, users } from '$lib/server/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { createAIProvider } from '$lib/server/ai';
import { sendAlert } from '$lib/server/alert';
import type { Actions } from './$types';

export const actions: Actions = {
	generate: async ({ request, locals, platform, url }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		if (!config.features.ai) return fail(400, { error: 'AI disabled' });

		const env = platform!.env;
		const db = createDb(env.DB);
		const formData = await request.formData();
		const prompt = formData.get('prompt') as string;
		const refImageUrl = formData.get('refImageUrl') as string | null;

		if (!prompt?.trim()) return fail(400, { error: 'Prompt required' });

		const recentCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(generations)
			.where(and(eq(generations.userId, locals.user.id), sql`created_at > ${Date.now() - 60000}`))
			.get();
		if (recentCount && recentCount.count >= 10) {
			return fail(429, { error: 'Too many requests' });
		}

		const cost = config.credits.costPerGeneration;
		if (config.features.credits) {
			const result = await db
				.update(users)
				.set({ credits: sql`credits - ${cost}` })
				.where(and(eq(users.id, locals.user.id), sql`credits >= ${cost}`))
				.returning({ credits: users.credits });
			if (!result.length) return fail(402, { error: 'Insufficient credits' });
		}

		const generationId = crypto.randomUUID();
		await db.insert(generations).values({
			id: generationId,
			userId: locals.user.id,
			prompt,
			refImageUrl,
			status: 'pending',
			provider: config.ai.provider,
			model: config.ai.defaultModel,
			creditsUsed: cost,
			createdAt: Date.now(),
		});

		if (config.features.credits) {
			const userRow = await db
				.select({ credits: users.credits })
				.from(users)
				.where(eq(users.id, locals.user.id))
				.get();
			await db.insert(creditLogs).values({
				id: crypto.randomUUID(),
				userId: locals.user.id,
				amount: -cost,
				balance: userRow!.credits!,
				type: 'freeze',
				refId: generationId,
				createdAt: Date.now(),
			});
		}

		const ai = createAIProvider(env);
		try {
			const result = await ai.generate({
				prompt,
				refImageUrl: refImageUrl ?? undefined,
				model: config.ai.defaultModel,
				webhookUrl: ai.supportsWebhook ? `${url.origin}/api/webhook/replicate` : undefined,
			});

			if (!ai.supportsWebhook && result.imageUrl) {
				platform!.context.waitUntil(
					(async () => {
						const imgRes = await fetch(result.imageUrl);
						const imgData = await imgRes.arrayBuffer();
						const r2Key = `generations/${locals.user!.id}/${generationId}.png`;
						await env.R2.put(r2Key, imgData);
						await db
							.update(generations)
							.set({ status: 'done', resultUrl: r2Key })
							.where(eq(generations.id, generationId));
					})(),
				);
			} else if (ai.supportsWebhook) {
				await db
					.update(generations)
					.set({ status: 'processing' })
					.where(eq(generations.id, generationId));
			}

			return { generationId };
		} catch (err) {
			if (config.features.credits) {
				await db
					.update(users)
					.set({ credits: sql`credits + ${cost}` })
					.where(eq(users.id, locals.user.id));
				const userRow = await db
					.select({ credits: users.credits })
					.from(users)
					.where(eq(users.id, locals.user.id))
					.get();
				await db.insert(creditLogs).values({
					id: crypto.randomUUID(),
					userId: locals.user.id,
					amount: cost,
					balance: userRow!.credits!,
					type: 'unfreeze',
					refId: generationId,
					createdAt: Date.now(),
				});
			}
			await db
				.update(generations)
				.set({ status: 'failed', failureReason: 'api_error' })
				.where(eq(generations.id, generationId));

			platform!.context.waitUntil(
				sendAlert(env, 'AI Generation Failed', `User: ${locals.user.id}\nError: ${String(err)}`),
			);

			return fail(500, { error: 'Generation failed' });
		}
	},
};
