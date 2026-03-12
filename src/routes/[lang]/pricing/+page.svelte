<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import SEO from '$lib/components/SEO.svelte';

	let { data }: { data: any } = $props();
	let msg = $derived(getMessages(data.lang));
</script>

<SEO title={msg.pricing.title} description={msg.pricing.title} />

<h1>{msg.pricing.title}</h1>

<div class="pricing-grid">
	<div class="pricing-card">
		<h2>{msg.pricing.free}</h2>
		<p>{msg.pricing.freeDesc}</p>
		<p class="price">$0</p>
	</div>
	<div class="pricing-card">
		<h2>{msg.pricing.starter}</h2>
		<p>{msg.pricing.starterDesc}</p>
		<p class="price">$9</p>
		<a href="/api/checkout?plan=starter" class="buy-btn">{msg.pricing.buy}</a>
	</div>
	<div class="pricing-card">
		<h2>{msg.pricing.pro}</h2>
		<p>{msg.pricing.proDesc}</p>
		<p class="price">$29</p>
		<a href="/api/checkout?plan=pro" class="buy-btn">{msg.pricing.buy}</a>
	</div>
</div>
