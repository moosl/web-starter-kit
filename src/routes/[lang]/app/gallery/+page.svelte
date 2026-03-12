<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import SEO from '$lib/components/SEO.svelte';

	let { data }: { data: any } = $props();
	let msg = $derived(getMessages(data.lang));
</script>

<SEO title={msg.gallery.title} description={msg.gallery.title} />

<h1 class="text-2xl font-bold text-gray-900">{msg.gallery.title}</h1>

{#if data.generations.length === 0}
	<div class="mt-12 text-center">
		<svg class="mx-auto w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
		</svg>
		<p class="mt-2 text-sm text-gray-500">{msg.gallery.empty}</p>
	</div>
{:else}
	<div class="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
		{#each data.generations as gen}
			<div class="group bg-white rounded-xl border border-gray-200 overflow-hidden">
				{#if gen.status === 'done' && gen.resultUrl}
					<div class="aspect-square bg-gray-100">
						<img
							src="/api/image/{gen.resultUrl}?w=300"
							alt={gen.prompt}
							loading="lazy"
							decoding="async"
							class="w-full h-full object-cover"
						/>
					</div>
				{:else}
					<div class="aspect-square bg-gray-50 flex items-center justify-center">
						{#if gen.status === 'pending' || gen.status === 'processing'}
							<div class="text-center">
								<svg class="mx-auto w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								<span class="mt-2 block text-xs text-gray-400">
									{msg.gallery.status[gen.status as keyof typeof msg.gallery.status]}
								</span>
							</div>
						{:else}
							<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
								{msg.gallery.status[gen.status as keyof typeof msg.gallery.status]}
							</span>
						{/if}
					</div>
				{/if}
				<div class="p-3">
					<p class="text-xs text-gray-600 line-clamp-2">{gen.prompt}</p>
				</div>
			</div>
		{/each}
	</div>
{/if}
