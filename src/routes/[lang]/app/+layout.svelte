<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: any; children: Snippet } = $props();
	let msg = $derived(getMessages(data.lang));
	let pathname = $derived($page.url.pathname);
</script>

<div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6 min-h-[calc(100vh-8rem)]">
	<aside class="w-full md:w-56 shrink-0">
		<div class="bg-white rounded-xl border border-gray-200 p-4 md:sticky md:top-20">
			<div class="flex items-center gap-3 pb-4 border-b border-gray-100">
				{#if data.user.avatarUrl}
					<img src={data.user.avatarUrl} alt="" class="w-9 h-9 rounded-full" />
				{/if}
				<div class="min-w-0">
					<p class="text-sm font-medium text-gray-900 truncate">{data.user.name}</p>
					<p class="text-xs text-gray-500">{data.user.plan}</p>
				</div>
			</div>
			<nav class="mt-3 flex flex-col gap-0.5">
				<a
					href="/{data.lang}/app"
					class="px-3 py-2 rounded-lg text-sm transition-colors {pathname === `/${data.lang}/app` ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
				>
					{msg.nav.app}
				</a>
				<a
					href="/{data.lang}/app/gallery"
					class="px-3 py-2 rounded-lg text-sm transition-colors {pathname.includes('/gallery') ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
				>
					{msg.nav.gallery}
				</a>
				<a
					href="/{data.lang}/app/account"
					class="px-3 py-2 rounded-lg text-sm transition-colors {pathname.includes('/account') ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
				>
					{msg.nav.account}
				</a>
			</nav>
			<div class="mt-4 pt-3 border-t border-gray-100">
				<div class="px-3 py-2 bg-gray-50 rounded-lg">
					<p class="text-xs text-gray-500">{msg.app.credits}</p>
					<p class="text-lg font-semibold text-gray-900">{data.user.credits}</p>
				</div>
			</div>
		</div>
	</aside>
	<div class="flex-1 min-w-0">
		{@render children()}
	</div>
</div>
