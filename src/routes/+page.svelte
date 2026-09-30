<script lang="ts">
	// Demo and manual test bench for the package (not packaged). `bun run dev` → :7013.
	import {
		GeocoderError,
		GeocoderSearch,
		geocoderSearch,
		type GeocoderResult,
		type SearchFn
	} from '$lib/index.js';

	const live = geocoderSearch({ endpoint: '/geocoder/search', country: 'AU' });

	// Simulated failures, to see every state without breaking a real geocoder
	type Mode = 'live' | 'down' | 'slow' | 'empty' | 'jitter';
	let mode = $state<Mode>('live');
	const wait = (ms: number, signal: AbortSignal) =>
		new Promise<void>((resolve, reject) => {
			const t = setTimeout(resolve, ms);
			signal.addEventListener('abort', () => {
				clearTimeout(t);
				reject(new DOMException('aborted', 'AbortError'));
			});
		});
	const search: SearchFn = async (q, opts) => {
		if (mode === 'down') throw new GeocoderError('Geocoder unavailable', 503);
		if (mode === 'empty') return [];
		if (mode === 'slow') await wait(4000, opts.signal);
		// Earlier keystrokes answer later: the component must still show the newest query's results
		// (ignores aborts on purpose, so only the component's own stale-response guard stands)
		if (mode === 'jitter') {
			await new Promise((r) => setTimeout(r, Math.max(0, 3000 - q.length * 200)));
			return live(q, { ...opts, signal: new AbortController().signal });
		}
		return live(q, opts);
	};

	let picked = $state<{ result: GeocoderResult; pin: boolean; kind: string } | null>(null);
	let submits = $state(0);
	let prefill = $state('68-70 Elbow Street West Kempsey');
</script>

<svelte:head><title>findnearest-kit</title></svelte:head>

<main>
	<h1>findnearest-kit</h1>

	<label class="mode">
		Geocoder
		<select bind:value={mode}>
			<option value="live">Live (via /geocoder/search proxy)</option>
			<option value="down">Down (503)</option>
			<option value="slow">Slow (4 s)</option>
			<option value="empty">Always empty</option>
			<option value="jitter">Out-of-order responses</option>
		</select>
	</label>

	<section>
		<h2>Dropdown (map overlay)</h2>
		<div class="map">
			<div class="overlay">
				<GeocoderSearch
					{search}
					bias={() => ({ lat: -33.8688, lon: 151.2093 })}
					clearOnSelect
					onSelect={(result, info) => (picked = { result, ...info })}
				/>
			</div>
		</div>
	</section>

	<section>
		<h2>Inline (form field, pre-filled)</h2>
		<form onsubmit={(e) => { e.preventDefault(); submits++; }}>
			<label for="find-address">Find address</label>
			<GeocoderSearch
				id="find-address"
				{search}
				value={prefill}
				layout="inline"
				onSelect={(result, info) => (picked = { result, ...info })}
			/>
			<button type="button" onclick={() => (prefill = prefill ? '' : '68 Elbow Street West Kempsey')}>
				Change pre-fill from outside
			</button>
			<p class="submits">Form submits: {submits} (Enter in the box must never add one)</p>
		</form>
	</section>

	<section>
		<h2>Last pick</h2>
		<pre>{picked ? JSON.stringify(picked, null, 2) : '—'}</pre>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
		color: #0f172a;
		background: #f8fafc;
	}
	main {
		max-width: 720px;
		margin: 0 auto;
		padding: 24px 16px 64px;
	}
	h1 {
		font-size: 1.25rem;
	}
	h2 {
		font-size: 0.9rem;
		margin: 28px 0 8px;
	}
	.mode {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 0.875rem;
	}
	.map {
		position: relative;
		height: 280px;
		border-radius: 6px;
		background: repeating-linear-gradient(45deg, #dbeafe 0 12px, #e0f2fe 12px 24px);
	}
	.overlay {
		position: absolute;
		top: 12px;
		left: 12px;
		width: min(360px, calc(100% - 24px));
	}
	form {
		display: grid;
		gap: 6px;
		max-width: 440px;
		font-size: 0.875rem;
	}
	form button {
		justify-self: start;
		margin-top: 8px;
	}
	pre {
		font-size: 0.75rem;
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		padding: 8px;
		overflow-x: auto;
	}
</style>
