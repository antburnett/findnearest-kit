<script lang="ts">
	/**
	 * Geocoder search box: type, pick a result, get it back through onSelect.
	 *
	 * Owns the input and its result list only. It never imports a map and never knows a URL:
	 * the app passes `search` (see geocoderSearch()) and decides what a pick does. `pin` in the
	 * onSelect info says whether the pick is a spot worth a marker (address, place, point,
	 * location) or an area the map should only move to (a town).
	 *
	 * Behaviour: debounce, bias to the map centre, a slow notice for the geocoder's cold street
	 * path, a hard timeout, and stale responses dropped (a slow earlier search can never
	 * overwrite a newer one). Every failure and every empty result is said out loud, Enter
	 * never submits a surrounding form, and focusing a pre-filled box searches what is in it.
	 */
	import {
		GeocoderError,
		isSpot,
		kindOf,
		MIN_QUERY_LENGTH,
		type GeocoderResult,
		type ResultKind,
		type SearchFn
	} from './client.js';

	interface Props {
		/** Runs a search; build one with geocoderSearch() */
		search: SearchFn;
		/** A result was picked */
		onSelect: (result: GeocoderResult, info: { pin: boolean; kind: ResultKind }) => void;
		/** The box text. Pass one-way to pre-fill (it never searches until focused), or bind it. */
		value?: string;
		/** Point to rank results near, read at search time (e.g. the map centre) */
		bias?: () => { lat: number; lon: number } | null | undefined;
		placeholder?: string;
		/** Accessible name when no visible <label for> points at `id` */
		label?: string;
		id?: string;
		limit?: number;
		minLength?: number;
		debounceMs?: number;
		/** Give up after this long; the geocoder's cold street path takes 6 to 10 s */
		timeoutMs?: number;
		/** Say "still searching" after this long */
		slowAfterMs?: number;
		/** 'dropdown' floats over what is below (maps); 'inline' pushes it down (forms) */
		layout?: 'dropdown' | 'inline';
		/** Empty the box after a pick instead of showing the picked text */
		clearOnSelect?: boolean;
		/** Chip text for a result; defaults to its kind (town, address, place, point, location) */
		kindLabel?: (result: GeocoderResult) => string;
		disabled?: boolean;
	}

	let {
		search,
		onSelect,
		value = $bindable(''),
		bias,
		placeholder = 'Search for a town, suburb or address…',
		label,
		id,
		limit = 6,
		minLength = MIN_QUERY_LENGTH,
		debounceMs = 250,
		timeoutMs = 35_000,
		slowAfterMs = 2_000,
		layout = 'dropdown',
		clearOnSelect = false,
		kindLabel = (r: GeocoderResult) => kindOf(r),
		disabled = false
	}: Props = $props();

	const uid = $props.id();
	const inputId = $derived(id ?? `fnk-geocoder-${uid}`);
	const listId = `fnk-geocoder-list-${uid}`;

	type Status = 'idle' | 'searching' | 'slow' | 'empty' | 'error';

	let results = $state<GeocoderResult[]>([]);
	let status = $state<Status>('idle');
	let errorMessage = $state('');
	let open = $state(false);
	let active = $state(-1);
	/** The query the current results (or empty/error status) belong to */
	let searchedFor = $state('');

	let seq = 0;
	let inflight: AbortController | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	const busy = $derived(status === 'searching' || status === 'slow');
	const showList = $derived(open && results.length > 0);
	const statusText = $derived(
		status === 'searching'
			? 'Searching…'
			: status === 'slow'
				? 'Still searching… full street addresses can take a few seconds'
				: status === 'empty'
					? emptyText(searchedFor)
					: status === 'error'
						? errorMessage
						: ''
	);

	function emptyText(q: string) {
		// "68-70 Elbow Street" finds nothing while "68 Elbow Street" does
		return /^\s*\d+[a-z]?\s*[-–]\s*\d+/i.test(q)
			? `Nothing found for “${q}”. Try a single street number.`
			: `Nothing found for “${q}”.`;
	}

	function cancel() {
		clearTimeout(debounceTimer);
		seq++;
		inflight?.abort();
		inflight = null;
	}

	function onInput() {
		clearTimeout(debounceTimer);
		const q = value.trim();
		if (q.length < minLength) {
			cancel();
			results = [];
			status = 'idle';
			searchedFor = '';
			open = false;
			return;
		}
		debounceTimer = setTimeout(() => run(q), debounceMs);
	}

	async function run(q: string) {
		clearTimeout(debounceTimer);
		const mine = ++seq;
		inflight?.abort();
		const ctl = new AbortController();
		inflight = ctl;
		let timedOut = false;
		const abortTimer = setTimeout(() => {
			timedOut = true;
			ctl.abort();
		}, timeoutMs);
		const slowTimer = setTimeout(() => {
			if (mine === seq) status = 'slow';
		}, slowAfterMs);

		searchedFor = q;
		status = 'searching';
		errorMessage = '';
		try {
			const hits = await search(q, { limit, bias: bias?.() ?? null, signal: ctl.signal });
			if (mine !== seq) return;
			results = hits;
			active = hits.length ? 0 : -1;
			status = hits.length ? 'idle' : 'empty';
			open = true;
		} catch (e) {
			if (mine !== seq) return;
			results = [];
			open = false;
			status = 'error';
			errorMessage = timedOut
				? 'Geocoder timed out'
				: e instanceof GeocoderError
					? e.message
					: 'Search failed';
		} finally {
			clearTimeout(abortTimer);
			clearTimeout(slowTimer);
			if (inflight === ctl) inflight = null;
		}
	}

	function onFocus() {
		const q = value.trim();
		if (q.length < minLength) return;
		if (q !== searchedFor) run(q);
		else if (results.length) open = true;
	}

	function pick(r: GeocoderResult) {
		cancel();
		value = clearOnSelect ? '' : r.display_text;
		searchedFor = value.trim();
		results = [];
		open = false;
		active = -1;
		status = 'idle';
		onSelect(r, { pin: isSpot(r), kind: kindOf(r) });
	}

	function clear() {
		cancel();
		value = '';
		searchedFor = '';
		results = [];
		open = false;
		status = 'idle';
		inputEl?.focus();
	}

	function onKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowDown':
				if (!results.length) return;
				e.preventDefault();
				if (!open) open = true;
				else active = Math.min(active + 1, results.length - 1);
				break;
			case 'ArrowUp':
				if (!showList) return;
				e.preventDefault();
				active = Math.max(active - 1, 0);
				break;
			case 'Enter': {
				// Never let Enter submit a form the box sits in
				e.preventDefault();
				if (showList && active >= 0) pick(results[active]);
				else {
					const q = value.trim();
					if (q.length >= minLength && (q !== searchedFor || status === 'error')) run(q);
				}
				break;
			}
			case 'Escape':
				if (showList) {
					e.preventDefault();
					open = false;
				} else if (value) {
					e.preventDefault();
					clear();
				}
				break;
		}
	}

	let rootEl: HTMLDivElement | undefined = $state();
	let inputEl: HTMLInputElement | undefined = $state();

	let focused = $state(false);
	function onFocusOut(e: FocusEvent) {
		if (rootEl?.contains(e.relatedTarget as Node | null)) return;
		open = false;
		focused = false;
	}
</script>

<div
	class="fnk-geocoder"
	class:fnk-inline={layout === 'inline'}
	bind:this={rootEl}
	onfocusin={() => (focused = true)}
	onfocusout={onFocusOut}
>
	<div class="fnk-field">
		<svg class="fnk-icon" viewBox="0 0 24 24" aria-hidden="true">
			<circle cx="11" cy="11" r="7" />
			<path d="m20 20-3.5-3.5" />
		</svg>
		<input
			bind:this={inputEl}
			id={inputId}
			type="text"
			role="combobox"
			aria-label={label ?? (id ? undefined : 'Search for a place')}
			aria-autocomplete="list"
			aria-expanded={showList}
			aria-controls={listId}
			aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
			aria-invalid={status === 'error' ? true : undefined}
			autocomplete="off"
			spellcheck="false"
			data-1p-ignore
			data-lpignore="true"
			data-protonpass-ignore="true"
			data-bwignore
			data-form-type="other"
			{placeholder}
			{disabled}
			bind:value
			oninput={onInput}
			onfocus={onFocus}
			onkeydown={onKeydown}
		/>
		{#if busy}
			<span class="fnk-spinner" aria-hidden="true"></span>
		{:else if value && !disabled}
			<button type="button" class="fnk-clear" aria-label="Clear search" onclick={clear}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
			</button>
		{/if}
	</div>

	<ul id={listId} class="fnk-results" role="listbox" aria-label="Search results" hidden={!showList}>
		{#each results as r, i (i)}
			<!-- Keyboard is handled on the combobox input (aria-activedescendant), per the ARIA pattern -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<li
				id="{listId}-{i}"
				role="option"
				aria-selected={i === active}
				class:fnk-active={i === active}
				class:fnk-highlight={r.highlight}
				onmousedown={(e) => e.preventDefault()}
				onmousemove={() => (active = i)}
				onclick={() => pick(r)}
			>
				<span class="fnk-kind fnk-kind-{kindOf(r)}">{kindLabel(r)}</span>
				<span class="fnk-text">{r.display_text}</span>
			</li>
		{/each}
	</ul>

	<div
		class="fnk-status"
		class:fnk-error={status === 'error'}
		class:fnk-away={!focused}
		role="status"
		aria-live="polite"
	>{statusText}</div>
</div>

<style>
	/* Theme through --fnk-* custom properties on any ancestor; the fallbacks are flat
	   light-theme values. */
	.fnk-geocoder {
		--_bg: var(--fnk-bg, #fff);
		--_fg: var(--fnk-fg, #0f172a);
		--_muted: var(--fnk-muted, #64748b);
		--_border: var(--fnk-border, #cbd5e1);
		--_divider: var(--fnk-divider, #e2e8f0);
		--_hover: var(--fnk-hover, #f1f5f9);
		--_accent: var(--fnk-accent, #2563eb);
		--_accent-soft: var(--fnk-accent-soft, #eff6ff);
		--_chip-bg: var(--fnk-chip-bg, #f1f5f9);
		--_error: var(--fnk-error, #b91c1c);
		--_radius: var(--fnk-radius, 4px);
		--_height: var(--fnk-height, 32px);
		--_font-size: var(--fnk-font-size, 0.875rem);
		--_ring: var(--fnk-ring, 0 0 0 3px rgb(37 99 235 / 0.2));
		--_shadow: var(--fnk-shadow, 0 4px 12px rgb(15 23 42 / 0.12));

		position: relative;
		width: 100%;
		font-size: var(--_font-size);
		color: var(--_fg);
	}

	.fnk-field {
		position: relative;
		display: flex;
		align-items: center;
	}

	input {
		box-sizing: border-box;
		width: 100%;
		height: var(--_height);
		padding: 0 2rem 0 2rem;
		font: inherit;
		color: var(--_fg);
		background: var(--_bg);
		border: 1px solid var(--_border);
		border-radius: var(--_radius);
		outline: none;
	}
	input:focus {
		border-color: var(--_accent);
		box-shadow: var(--_ring);
	}
	input[aria-invalid='true'] {
		border-color: var(--_error);
	}
	/* iOS zooms the page into any input under 16px */
	@media (pointer: coarse) {
		input {
			font-size: max(16px, 1em);
		}
	}
	input::placeholder {
		color: var(--_muted);
	}
	input:disabled {
		opacity: 0.6;
	}

	.fnk-icon {
		position: absolute;
		left: 0.6rem;
		width: 14px;
		height: 14px;
		fill: none;
		stroke: var(--_muted);
		stroke-width: 2.2;
		stroke-linecap: round;
		pointer-events: none;
	}

	.fnk-spinner {
		position: absolute;
		right: 0.6rem;
		width: 14px;
		height: 14px;
		border: 2px solid var(--_divider);
		border-top-color: var(--_accent);
		border-radius: 50%;
		animation: fnk-spin 0.7s linear infinite;
	}
	@keyframes fnk-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.fnk-spinner {
			animation-duration: 2s;
		}
	}

	.fnk-clear {
		position: absolute;
		right: 0.3rem;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: none;
		border: 0;
		border-radius: var(--_radius);
		cursor: pointer;
	}
	.fnk-clear:hover {
		background: var(--_hover);
	}
	.fnk-clear svg {
		width: 12px;
		height: 12px;
		fill: none;
		stroke: var(--_muted);
		stroke-width: 2.4;
		stroke-linecap: round;
	}

	.fnk-results {
		box-sizing: border-box;
		margin: 4px 0 0;
		padding: 4px 0;
		list-style: none;
		max-height: 320px;
		overflow-y: auto;
		background: var(--_bg);
		border: 1px solid var(--_border);
		border-radius: var(--_radius);
	}
	.fnk-results[hidden] {
		display: none;
	}
	.fnk-geocoder:not(.fnk-inline) .fnk-results {
		position: absolute;
		left: 0;
		right: 0;
		z-index: var(--fnk-z, 10);
		box-shadow: var(--_shadow);
	}

	li {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		padding: 0.45rem 0.75rem;
		cursor: pointer;
		line-height: 1.3;
	}
	li.fnk-active {
		background: var(--_hover);
	}
	li.fnk-highlight {
		box-shadow: inset 3px 0 0 var(--_accent);
	}

	.fnk-kind {
		flex: 0 0 4.75rem;
		padding: 1px 0;
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-align: center;
		text-transform: uppercase;
		color: var(--_muted);
		background: var(--_chip-bg);
		border-radius: 3px;
	}
	.fnk-kind-town,
	.fnk-kind-location {
		color: var(--_accent);
		background: var(--_accent-soft);
	}
	.fnk-text {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.fnk-status {
		margin-top: 4px;
		font-size: 0.75rem;
		color: var(--_muted);
	}
	.fnk-status:empty {
		display: none;
	}
	.fnk-status.fnk-error {
		color: var(--_error);
	}
	/* Over a map the status floats like the list so it never shifts the page */
	.fnk-geocoder:not(.fnk-inline) .fnk-status {
		position: absolute;
		left: 0;
		right: 0;
		z-index: var(--fnk-z, 10);
		padding: 0.4rem 0.75rem;
		background: var(--_bg);
		border: 1px solid var(--_border);
		border-radius: var(--_radius);
		box-shadow: var(--_shadow);
	}
	/* ...and only while the box has focus, so a stale "nothing found" never sits on the map */
	.fnk-geocoder:not(.fnk-inline) .fnk-status.fnk-away,
	.fnk-geocoder:not(.fnk-inline) .fnk-results:not([hidden]) + .fnk-status {
		display: none;
	}
</style>
