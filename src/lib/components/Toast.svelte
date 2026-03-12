<script lang="ts" module>
	import { writable } from 'svelte/store';

	type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };

	export const toasts = writable<Toast[]>([]);

	let counter = 0;

	export function showToast(message: string, type: Toast['type'] = 'info') {
		const id = ++counter;
		toasts.update((t) => [...t, { id, message, type }]);
		setTimeout(() => {
			toasts.update((t) => t.filter((toast) => toast.id !== id));
		}, 4000);
	}
</script>

<script lang="ts">
	import { get } from 'svelte/store';

	let items = $derived(get(toasts));

	toasts.subscribe((v) => {
		items = v;
	});
</script>

<div class="toast-container">
	{#each items as toast (toast.id)}
		<div class="toast toast-{toast.type}">
			{toast.message}
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.toast {
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		color: white;
		font-size: 0.875rem;
		animation: slideIn 0.3s ease;
	}
	.toast-success {
		background: #16a34a;
	}
	.toast-error {
		background: #dc2626;
	}
	.toast-info {
		background: #2563eb;
	}
	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
</style>
