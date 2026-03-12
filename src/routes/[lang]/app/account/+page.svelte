<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import SEO from '$lib/components/SEO.svelte';

	let { data }: { data: any } = $props();
	let msg = $derived(getMessages(data.lang));
</script>

<SEO title={msg.account.title} description={msg.account.title} />

<h1 class="text-2xl font-bold text-gray-900">{msg.account.title}</h1>

<div class="mt-6 space-y-4">
	<div class="bg-white rounded-xl border border-gray-200 p-5">
		<h2 class="text-sm font-medium text-gray-500 uppercase tracking-wide">{msg.account.plan}</h2>
		<p class="mt-1 text-2xl font-semibold text-gray-900 capitalize">{data.user.plan}</p>
	</div>
	<div class="bg-white rounded-xl border border-gray-200 p-5">
		<h2 class="text-sm font-medium text-gray-500 uppercase tracking-wide">{msg.account.credits}</h2>
		<p class="mt-1 text-2xl font-semibold text-gray-900">{data.user.credits}</p>
	</div>
</div>
