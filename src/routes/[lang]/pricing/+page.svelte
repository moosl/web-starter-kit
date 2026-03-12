<script lang="ts">
	import { getMessages } from '$lib/i18n';
	import SEO from '$lib/components/SEO.svelte';

	let { data }: { data: any } = $props();
	let msg = $derived(getMessages(data.lang));
</script>

<SEO title={msg.pricing.title} description={msg.pricing.title} />

<section class="max-w-5xl mx-auto px-4 sm:px-6 py-16">
	<div class="text-center">
		<h1 class="text-3xl font-bold text-gray-900">{msg.pricing.title}</h1>
	</div>

	<div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- Free -->
		<div class="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
			<h2 class="text-lg font-semibold text-gray-900">{msg.pricing.free}</h2>
			<p class="mt-2 text-sm text-gray-500 flex-1">{msg.pricing.freeDesc}</p>
			<div class="mt-6">
				<span class="text-4xl font-bold text-gray-900">$0</span>
				<span class="text-sm text-gray-500">/mo</span>
			</div>
			<a
				href="/{data.lang}/app"
				class="mt-6 block text-center px-4 py-2.5 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
			>
				{msg.landing.cta}
			</a>
		</div>

		<!-- Starter -->
		<div class="bg-white rounded-xl border-2 border-indigo-600 p-6 flex flex-col relative">
			<div class="absolute -top-3 left-1/2 -translate-x-1/2">
				<span class="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-white">Popular</span>
			</div>
			<h2 class="text-lg font-semibold text-gray-900">{msg.pricing.starter}</h2>
			<p class="mt-2 text-sm text-gray-500 flex-1">{msg.pricing.starterDesc}</p>
			<div class="mt-6">
				<span class="text-4xl font-bold text-gray-900">$9</span>
				<span class="text-sm text-gray-500">/mo</span>
			</div>
			<a
				href="/api/checkout?plan=starter"
				class="mt-6 block text-center px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
			>
				{msg.pricing.buy}
			</a>
		</div>

		<!-- Pro -->
		<div class="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
			<h2 class="text-lg font-semibold text-gray-900">{msg.pricing.pro}</h2>
			<p class="mt-2 text-sm text-gray-500 flex-1">{msg.pricing.proDesc}</p>
			<div class="mt-6">
				<span class="text-4xl font-bold text-gray-900">$29</span>
				<span class="text-sm text-gray-500">/mo</span>
			</div>
			<a
				href="/api/checkout?plan=pro"
				class="mt-6 block text-center px-4 py-2.5 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
			>
				{msg.pricing.buy}
			</a>
		</div>
	</div>
</section>
