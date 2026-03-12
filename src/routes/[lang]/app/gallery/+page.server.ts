import { createDb } from '$lib/server/db';
import { generations } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = createDb(platform!.env.DB);
	const items = await db
		.select()
		.from(generations)
		.where(eq(generations.userId, locals.user!.id))
		.orderBy(desc(generations.createdAt))
		.limit(50);

	return { generations: items };
};
