import { json, error } from '@sveltejs/kit';
import { createDb } from '$lib/server/db';
import { generations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals, platform }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'Missing id');

	const db = createDb(platform!.env.DB);
	const gen = await db.select().from(generations).where(eq(generations.id, id)).get();

	if (!gen || gen.userId !== locals.user.id) throw error(404, 'Not found');

	return json({
		status: gen.status,
		resultUrl: gen.status === 'done' ? `/api/image/${gen.resultUrl}` : null,
		failureReason: gen.failureReason,
	});
};
