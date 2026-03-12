<script lang="ts">
	import { page } from '$app/stores';
	import { getMessages } from '$lib/i18n';
	import SEO from '$lib/components/SEO.svelte';

	let { data }: { data: any } = $props();
	let msg = $derived(getMessages(data.lang));
	let status = $derived($page.url.searchParams.get('status'));
</script>

<SEO title={msg.billing.success} description="" />

<div class="max-w-md mx-auto mt-12 text-center">
	{#if status === 'success'}
		<div class="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
			<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</div>
		<h1 class="mt-4 text-xl font-semibold text-gray-900">{msg.billing.success}</h1>
	{:else}
		<div class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
			<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</div>
		<h1 class="mt-4 text-xl font-semibold text-gray-900">{msg.billing.cancelled}</h1>
	{/if}
	<a
		href="/{data.lang}/app"
		class="mt-6 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
	>
		<svg class="mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		{msg.nav.app}
	</a>
</div>
