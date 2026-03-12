<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: any; children: Snippet } = $props();
	let msg = $derived(getMessages(data.lang));
</script>

<div class="app-layout">
	<aside>
		<div class="user-info">
			{#if data.user.avatarUrl}
				<img src={data.user.avatarUrl} alt="" width="40" height="40" />
			{/if}
			<span>{data.user.name}</span>
		</div>
		<nav>
			<a href="/{data.lang}/app">{msg.nav.app}</a>
			<a href="/{data.lang}/app/gallery">{msg.nav.gallery}</a>
			<a href="/{data.lang}/app/account">{msg.nav.account}</a>
		</nav>
		<div class="credits">
			{msg.app.credits}: {data.user.credits}
		</div>
	</aside>
	<div class="app-content">
		{@render children()}
	</div>
</div>
