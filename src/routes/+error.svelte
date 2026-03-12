<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="error-page">
	<h1>{$page.status}</h1>
	<p>{$page.error?.message ?? 'Something went wrong'}</p>
	<a href="/">Go home</a>
</div>
