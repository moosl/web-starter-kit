<script lang="ts">
	import { config } from '$lib/config';
	import { page } from '$app/stores';

	let {
		title,
		description,
		ogImage = `${config.site.url}/og-default.png`,
		ogType = 'website',
		jsonLd = null as Record<string, unknown> | null,
	}: {
		title: string;
		description: string;
		ogImage?: string;
		ogType?: string;
		jsonLd?: Record<string, unknown> | null;
	} = $props();

	let locale = $derived($page.params.lang ?? config.i18n.defaultLocale);
	let pathWithoutLocale = $derived($page.url.pathname.replace(/^\/[a-z]{2}/, ''));
	let canonicalUrl = $derived(`${config.site.url}/${locale}${pathWithoutLocale}`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={config.site.name} />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if ogImage}
		<meta name="twitter:image" content={ogImage} />
	{/if}

	<!-- Hreflang -->
	{#each config.i18n.locales as lang}
		<link rel="alternate" hreflang={lang} href={`${config.site.url}/${lang}${pathWithoutLocale}`} />
	{/each}
	<link
		rel="alternate"
		hreflang="x-default"
		href={`${config.site.url}/${config.i18n.defaultLocale}${pathWithoutLocale}`}
	/>

	<!-- JSON-LD Structured Data -->
	{#if jsonLd}
		{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
	{/if}
</svelte:head>
