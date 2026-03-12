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

<div class="max-w-2xl">
	<h1 class="text-2xl font-bold text-gray-900">{msg.nav.app}</h1>
	<p class="mt-1 text-sm text-gray-500">{msg.landing.subtitle}</p>

	<form
		method="POST"
		action="?/generate"
		class="mt-6 space-y-4"
		use:enhance={() => {
			generating = true;
			return async ({ update }) => {
				generating = false;
				await update();
			};
		}}
	>
		<div>
			<textarea
				name="prompt"
				placeholder={msg.app.promptPlaceholder}
				rows="3"
				required
				class="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
			></textarea>
		</div>

		{#if config.features.upload}
			<div>
				<label class="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
					<div class="text-center">
						<svg class="mx-auto w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<p class="mt-1 text-sm text-gray-500">Upload reference image</p>
					</div>
					<input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" />
				</label>
			</div>
		{/if}

		<Turnstile bind:token={turnstileToken} />

		<button
			type="submit"
			disabled={generating}
			class="w-full px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{#if generating}
				<span class="inline-flex items-center gap-2">
					<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					{msg.app.generating}
				</span>
			{:else}
				{msg.app.generate}
			{/if}
		</button>
	</form>

	{#if form?.error}
		<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
			<p class="text-sm text-red-700">{form.error}</p>
		</div>
	{/if}
</div>
