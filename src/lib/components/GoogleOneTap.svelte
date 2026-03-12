<script lang="ts">
	import { onMount } from 'svelte';
	import { config } from '$lib/config';

	let clientId = '';

	onMount(async () => {
		if (!config.features.auth) return;

		const mod = await import('$env/static/public');
		clientId = (mod as any).PUBLIC_GOOGLE_CLIENT_ID ?? '';
		if (!clientId) return;

		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.onload = () => {
			(window as any).google.accounts.id.initialize({
				client_id: clientId,
				callback: handleCredentialResponse,
				auto_select: true,
				cancel_on_tap_outside: false,
			});
			(window as any).google.accounts.id.prompt();
		};
		document.head.appendChild(script);
	});

	async function handleCredentialResponse(response: { credential: string }) {
		const res = await fetch('/api/auth/google-one-tap', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ credential: response.credential }),
		});

		if (res.ok) {
			window.location.reload();
		}
	}
</script>
