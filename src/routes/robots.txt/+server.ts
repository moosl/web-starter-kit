import { config } from '$lib/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const body = `User-agent: *
Disallow: /app/
Disallow: /api/
Disallow: /login/

Sitemap: ${config.site.url}/sitemap.xml`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
