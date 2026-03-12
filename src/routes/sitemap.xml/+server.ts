import { config } from '$lib/config';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const { url } = config.site;
	const locales = config.i18n.locales;

	// Public paths (without locale prefix)
	const paths = ['/', '/pricing', '/privacy', '/terms'];

	const urls = paths.flatMap((path) =>
		locales.map((locale) => {
			const loc = `${url}/${locale}${path === '/' ? '' : path}`;
			const alternates = locales
				.map(
					(lang) =>
						`    <xhtml:link rel="alternate" hreflang="${lang}" href="${url}/${lang}${path === '/' ? '' : path}" />`
				)
				.join('\n');
			return `  <url>
    <loc>${loc}</loc>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${url}/${config.i18n.defaultLocale}${path === '/' ? '' : path}" />
  </url>`;
		})
	);

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
