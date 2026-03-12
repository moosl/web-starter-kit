import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const key = params.key;
	if (!key) throw error(400, 'Missing key');

	const parts = key.split('/');
	if (parts.length < 3 || parts[1] !== locals.user.id) {
		throw error(403, 'Forbidden');
	}

	const env = platform!.env;
	const object = await env.R2.get(key);
	if (!object) throw error(404, 'Not found');

	const headers = new Headers();
	headers.set('Content-Type', object.httpMetadata?.contentType ?? 'image/png');
	headers.set('Cache-Control', 'private, max-age=3600');

	return new Response(object.body, { headers });
};
