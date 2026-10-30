<script lang="ts">
	// Demo for UpdateBanner with the kit's base CSS, in both modes. Not packaged.
	import '$lib/styles/fn.css';
	import { UpdateBanner } from '$lib/index.js';

	let dark = $state(false);
	let key = $state(0);
	$effect(() => {
		document.documentElement.setAttribute('data-mode', dark ? 'dark' : 'light');
	});
</script>

<svelte:head><title>UpdateBanner · findnearest-kit</title></svelte:head>

<main class="fn-p-6 fn-flex fn-flex-col fn-gap-3">
	<h1 class="fn-text-xl">UpdateBanner</h1>
	<p>Forced on with <code class="fn-code">show</code>; in an app it follows SvelteKit's version poll.</p>
	<div class="fn-flex fn-gap-2">
		<button class="fn-btn fn-btn-outlined" onclick={() => (dark = !dark)}>
			{dark ? 'Light mode' : 'Dark mode'}
		</button>
		<button class="fn-btn fn-btn-outlined" onclick={() => key++}>Show again</button>
	</div>
</main>

{#key key}
	<UpdateBanner appName="FindNearest Admin" show />
{/key}
