import { json, error } from '@sveltejs/kit';
import { config } from '$lib/config';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, platform, request }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (!config.features.upload) throw error(400, 'Upload disabled');

	const env = platform!.env;
	const formData = await request.formData();
	const file = formData.get('file') as File | null;

	if (!file || !file.size) throw error(400, 'No file provided');

	const maxBytes = config.upload.maxSizeMB * 1024 * 1024;
	if (file.size > maxBytes) throw error(400, `File too large (max ${config.upload.maxSizeMB}MB)`);

	const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
	if (!config.upload.allowedTypes.includes(ext as any)) {
		throw error(400, `File type not allowed. Accepted: ${config.upload.allowedTypes.join(', ')}`);
	}

	const fileKey = `uploads/${locals.user.id}/${crypto.randomUUID()}.${ext}`;

	await env.R2.put(fileKey, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type },
	});

	return json({ fileKey });
};
