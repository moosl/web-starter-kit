<script lang="ts">
	import { config } from '$lib/config';
	import { page } from '$app/stores';

	let { title, description, ogImage = '' }: { title: string; description: string; ogImage?: string } = $props();

	let currentUrl = $derived($page.url.href);
	let locale = $derived($page.params.lang ?? config.i18n.defaultLocale);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={currentUrl} />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}

	{#each config.i18n.locales as lang}
		<link rel="alternate" hreflang={lang} href={currentUrl.replace(`/${locale}/`, `/${lang}/`)} />
	{/each}
	<link
		rel="alternate"
		hreflang="x-default"
		href={currentUrl.replace(`/${locale}/`, `/${config.i18n.defaultLocale}/`)}
	/>
</svelte:head>
