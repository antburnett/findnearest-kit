<!--
  "New version available" prompt, the house standard for every FindNearest SvelteKit app.
  When SvelteKit's version poll (svelte.config.js `kit.version.pollInterval`) sees a newer build,
  `updated.current` turns true and this dark pill appears at the bottom centre with a Reload
  button. It never reloads by itself, so nobody loses a half-finished edit; dismissing hides it
  until the next page load. In dev the build version never changes, so it never shows there.

  Colours are kit tokens only (needs the base CSS): the pill is bg-inverse (surface-900 light,
  surface-600 dark) with on-solid text; the icon is warning-300, which clears 3:1 on both.
-->
<script lang="ts">
	import { updated } from '$app/state';

	interface Props {
		/** The app's name, as it reads in the message: "A new version of {appName} is available". */
		appName: string;
		/** Force it shown (true) or hidden (false), for demos and tests. Unset = follow SvelteKit. */
		show?: boolean;
	}

	let { appName, show }: Props = $props();

	let dismissed = $state(false);
	let visible = $derived((show ?? updated.current) && !dismissed);
</script>

{#if visible}
	<div class="fnk-update" role="status" aria-live="polite">
		<svg class="fnk-update-icon" viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
			/>
			<path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
		</svg>
		<span class="fnk-update-text">A new version of {appName} is available</span>
		<button type="button" class="fnk-update-reload" onclick={() => location.reload()}>
			Reload
		</button>
		<button
			type="button"
			class="fnk-update-dismiss"
			aria-label="Dismiss"
			title="Dismiss"
			onclick={() => (dismissed = true)}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
		</button>
	</div>
{/if}

<style>
	.fnk-update {
		position: fixed;
		/* Centred by auto margins, not left: 50% + transform: that halves the width the
		   text may use before it wraps. */
		left: 0;
		right: 0;
		bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
		width: max-content;
		max-width: calc(100vw - 2rem);
		margin-inline: auto;
		z-index: 1000;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.5rem 0.5rem 1rem;
		background: var(--fn-color-bg-inverse);
		color: var(--fn-color-on-solid);
		border-radius: var(--fn-radius-full);
		box-shadow: var(--fn-shadow-lg);
		font-size: 0.875rem;
		line-height: 1.25;
		animation: fnk-update-in 240ms var(--fn-ease-standard);
	}
	svg {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		flex-shrink: 0;
	}
	.fnk-update-icon {
		width: 18px;
		height: 18px;
		color: var(--fn-color-warning-300);
	}
	.fnk-update-text {
		min-width: 0;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.fnk-update-reload {
		flex-shrink: 0;
		padding: 0.25rem 1rem;
		border: 0;
		border-radius: var(--fn-radius-full);
		background: var(--fn-color-primary-600);
		color: var(--fn-color-on-solid);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 120ms var(--fn-ease-standard);
	}
	.fnk-update-reload:hover {
		background: var(--fn-color-primary-700);
	}
	.fnk-update-dismiss {
		flex-shrink: 0;
		display: inline-grid;
		place-items: center;
		width: 28px;
		height: 28px;
		padding: 0;
		border: 0;
		border-radius: var(--fn-radius-full);
		background: transparent;
		color: color-mix(in oklch, var(--fn-color-on-solid) 75%, transparent);
		cursor: pointer;
	}
	.fnk-update-dismiss svg {
		width: 16px;
		height: 16px;
	}
	.fnk-update-dismiss:hover {
		background: color-mix(in oklch, var(--fn-color-on-solid) 12%, transparent);
		color: var(--fn-color-on-solid);
	}
	.fnk-update-reload:focus-visible,
	.fnk-update-dismiss:focus-visible {
		outline: 2px solid var(--fn-color-on-solid);
		outline-offset: 2px;
	}
	/* A phone can't fit the whole sentence on one line: let it wrap, in a rounded box. */
	@media (max-width: 480px) {
		.fnk-update {
			border-radius: var(--fn-radius-xl);
		}
		.fnk-update-text {
			white-space: normal;
		}
	}
	@keyframes fnk-update-in {
		from {
			opacity: 0;
			transform: translateY(1rem);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.fnk-update {
			animation: none;
		}
	}
</style>
