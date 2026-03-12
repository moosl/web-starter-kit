<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import { config } from '$lib/config';
	import Toast from '$lib/components/Toast.svelte';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: any; children: Snippet } = $props();
	let msg = $derived(getMessages(data.lang));
</script>

<nav>
	<a href="/{data.lang}/">{msg.nav.home}</a>
	{#if config.features.payments}
		<a href="/{data.lang}/pricing">{msg.nav.pricing}</a>
	{/if}
	<div class="nav-right">
		{#if data.user}
			<a href="/{data.lang}/app">{msg.nav.app}</a>
			<span>{data.user.name}</span>
		{:else if config.features.auth}
			<a href="/login">{msg.nav.login}</a>
		{/if}
		{#each config.i18n.locales as locale}
			<a href="/{locale}/" class:active={data.lang === locale}>{locale.toUpperCase()}</a>
		{/each}
	</div>
</nav>

<main>
	{@render children()}
</main>

<footer>
	<a href="/{data.lang}/privacy">{msg.footer.privacy}</a>
	<a href="/{data.lang}/terms">{msg.footer.terms}</a>
</footer>

<Toast />
