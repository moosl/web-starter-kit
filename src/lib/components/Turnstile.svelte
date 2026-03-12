<script lang="ts">
	import { onMount } from 'svelte';
	import { config } from '$lib/config';

	let { token = $bindable('') }: { token?: string } = $props();

	let siteKey = '';

	onMount(async () => {
		if (!config.features.turnstile) return;

		const mod = await import('$env/static/public');
		siteKey = (mod as any).PUBLIC_TURNSTILE_SITE_KEY ?? '';
		if (!siteKey) return;

		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
		script.async = true;

		(window as any).onTurnstileLoad = () => {
			(window as any).turnstile.render('#turnstile-widget', {
				sitekey: siteKey,
				callback: (t: string) => {
					token = t;
				},
			});
		};

		document.head.appendChild(script);
	});
</script>

{#if config.features.turnstile}
	<div id="turnstile-widget"></div>
{/if}
