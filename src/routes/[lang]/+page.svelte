<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import { config } from '$lib/config';
	import SEO from '$lib/components/SEO.svelte';

	let { data }: { data: any } = $props();
	let msg = $derived(getMessages(data.lang));

	let jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: config.site.name,
		url: config.site.url,
		description: msg.seo.landing.description,
		applicationCategory: 'DesignApplication',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
		},
	});
</script>

<SEO title={msg.landing.title} description={msg.seo.landing.description} {jsonLd} />

<section class="max-w-4xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
	<h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
		{msg.landing.title}
	</h1>
	<p class="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
		{msg.landing.subtitle}
	</p>
	<a
		href="/{data.lang}/app"
		class="mt-8 inline-flex items-center px-6 py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
	>
		{msg.landing.cta}
		<svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
	</a>
</section>
