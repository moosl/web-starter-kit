import { json, error } from '@sveltejs/kit';
import { AwsClient } from 'aws4fetch';
import { config } from '$lib/config';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	if (!config.features.upload) throw error(400, 'Upload disabled');

	const env = platform!.env;
	const fileKey = `uploads/${locals.user.id}/${crypto.randomUUID()}`;

	await env.KV.put(`upload:${fileKey}`, locals.user.id, { expirationTtl: 300 });

	const r2 = new AwsClient({
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	});

	const presignedUrl = await r2.sign(
		new Request(`${env.R2_ENDPOINT}/${fileKey}`, {
			method: 'PUT',
		}),
		{ aws: { signQuery: true } },
	);

	return json({
		uploadUrl: presignedUrl.url,
		fileKey,
	});
};
