<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import SEO from '$lib/components/SEO.svelte';

	let { data }: { data: any } = $props();
	let msg = $derived(getMessages(data.lang));
</script>

<SEO title={msg.account.title} description={msg.account.title} />

<h1>{msg.account.title}</h1>

<div class="account-info">
	<p>{msg.account.plan}: {data.user.plan}</p>
	<p>{msg.account.credits}: {data.user.credits}</p>
</div>
