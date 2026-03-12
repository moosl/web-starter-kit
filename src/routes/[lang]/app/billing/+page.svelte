<script lang="ts">
	import { page } from '$app/stores';
	import { getMessages } from '$lib/i18n';
	import SEO from '$lib/components/SEO.svelte';

	let { data }: { data: any } = $props();
	let msg = $derived(getMessages(data.lang));
	let status = $derived($page.url.searchParams.get('status'));
</script>

<SEO title={msg.billing.success} description="" />

<div class="billing-result">
	{#if status === 'success'}
		<p>{msg.billing.success}</p>
	{:else}
		<p>{msg.billing.cancelled}</p>
	{/if}
	<a href="/{data.lang}/app">&larr; {msg.nav.app}</a>
</div>
