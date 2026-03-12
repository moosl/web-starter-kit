<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import { config } from '$lib/config';
	import Turnstile from '$lib/components/Turnstile.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { enhance } from '$app/forms';

	let { data, form }: { data: any; form: any } = $props();
	let msg = $derived(getMessages(data.lang));

	let generating = $state(false);
	let turnstileToken = $state('');
</script>

<SEO title={msg.nav.app} description={msg.landing.subtitle} />

<div class="generate-page">
	<form
		method="POST"
		action="?/generate"
		use:enhance={() => {
			generating = true;
			return async ({ update }) => {
				generating = false;
				await update();
			};
		}}
	>
		<textarea name="prompt" placeholder={msg.app.promptPlaceholder} rows="3" required></textarea>

		{#if config.features.upload}
			<input type="file" accept="image/jpeg,image/png,image/webp" />
		{/if}

		<Turnstile bind:token={turnstileToken} />

		<button type="submit" disabled={generating}>
			{generating ? msg.app.generating : msg.app.generate}
		</button>
	</form>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
</div>
