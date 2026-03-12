<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import SEO from '$lib/components/SEO.svelte';

	let { data }: { data: any } = $props();
	let msg = $derived(getMessages(data.lang));
</script>

<SEO title={msg.seo.privacy.title} description={msg.seo.privacy.description} />

<section class="max-w-3xl mx-auto px-4 sm:px-6 py-12">
	<h1 class="text-2xl font-bold text-gray-900">{msg.privacy.title}</h1>
	<p class="mt-2 text-sm text-gray-400">{msg.privacy.lastUpdated}</p>
	<div class="mt-6 space-y-8">
		{#each msg.privacy.sections as section}
			<div>
				<h2 class="text-lg font-semibold text-gray-800">{section.heading}</h2>
				<p class="mt-2 text-sm text-gray-600 leading-relaxed">{section.content}</p>
			</div>
		{/each}
	</div>
</section>
