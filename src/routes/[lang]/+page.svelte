<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import SEO from '$lib/components/SEO.svelte';

	let { data }: { data: any } = $props();
	let msg = $derived(getMessages(data.lang));
</script>

<SEO title={msg.landing.title} description={msg.landing.subtitle} />

<section class="hero">
	<h1>{msg.landing.title}</h1>
	<p>{msg.landing.subtitle}</p>
	<a href="/{data.lang}/app" class="cta-btn">{msg.landing.cta}</a>
</section>
