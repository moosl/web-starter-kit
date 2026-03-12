<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import { config } from '$lib/config';
	import Toast from '$lib/components/Toast.svelte';
	import GoogleOneTap from '$lib/components/GoogleOneTap.svelte';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: any; children: Snippet } = $props();
	let msg = $derived(getMessages(data.lang));
</script>

<div class="min-h-screen flex flex-col bg-gray-50 text-gray-900">
	<nav class="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
			<div class="flex items-center gap-6">
				<a href="/{data.lang}/" class="text-lg font-semibold tracking-tight text-gray-900 hover:text-gray-700">
					{msg.nav.home}
				</a>
				{#if config.features.payments}
					<a href="/{data.lang}/pricing" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">
						{msg.nav.pricing}
					</a>
				{/if}
			</div>
			<div class="flex items-center gap-4">
				{#if data.user}
					<a href="/{data.lang}/app" class="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
						{msg.nav.app}
					</a>
					<div class="flex items-center gap-2">
						{#if data.user.avatarUrl}
							<img src={data.user.avatarUrl} alt="" class="w-7 h-7 rounded-full" />
						{/if}
						<span class="text-sm text-gray-700">{data.user.name}</span>
					</div>
				{:else if config.features.auth}
					<a href="/login" class="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg transition-colors">
						{msg.nav.login}
					</a>
				{/if}
				<div class="flex items-center gap-1 ml-2 border-l border-gray-200 pl-3">
					{#each config.i18n.locales as locale}
						<a
							href="/{locale}/"
							class="text-xs px-1.5 py-0.5 rounded transition-colors {data.lang === locale ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'}"
						>
							{locale.toUpperCase()}
						</a>
					{/each}
				</div>
			</div>
		</div>
	</nav>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="border-t border-gray-200 bg-white">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-sm text-gray-500">
			<span>&copy; {new Date().getFullYear()} Web Starter Kit</span>
			<div class="flex gap-4">
				<a href="/{data.lang}/privacy" class="hover:text-gray-700 transition-colors">{msg.footer.privacy}</a>
				<a href="/{data.lang}/terms" class="hover:text-gray-700 transition-colors">{msg.footer.terms}</a>
			</div>
		</div>
	</footer>
</div>

<Toast />

{#if !data.user && config.features.auth}
	<GoogleOneTap />
{/if}
