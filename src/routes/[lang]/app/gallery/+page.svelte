<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import SEO from '$lib/components/SEO.svelte';

	let { data }: { data: any } = $props();
	let msg = $derived(getMessages(data.lang));
</script>

<SEO title={msg.gallery.title} description={msg.gallery.title} />

<h1>{msg.gallery.title}</h1>

{#if data.generations.length === 0}
	<p>{msg.gallery.empty}</p>
{:else}
	<div class="gallery-grid">
		{#each data.generations as gen}
			<div class="gallery-item">
				{#if gen.status === 'done' && gen.resultUrl}
					<img
						src="/api/image/{gen.resultUrl}?w=300"
						alt={gen.prompt}
						loading="lazy"
						decoding="async"
					/>
				{:else}
					<div class="status-badge">
						{msg.gallery.status[gen.status as keyof typeof msg.gallery.status]}
					</div>
				{/if}
				<p class="prompt">{gen.prompt}</p>
			</div>
		{/each}
	</div>
{/if}
