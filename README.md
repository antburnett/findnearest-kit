# findnearest-kit

Shared FindNearest UI components for Svelte 5 apps. First component: **`GeocoderSearch`**, the
place search box for the FindNearest geocoder, shared by every app that searches it instead
of each keeping its own copy.

## Install

Installed from GitHub at a tag (not published to npm):

```bash
bun add github:antburnett/findnearest-kit#v0.1.0
```

Requires `svelte` 5.20 or later. Upgrading means bumping the tag.

## Use

```svelte
<script lang="ts">
	import { GeocoderSearch, geocoderSearch, zoomFor } from 'findnearest-kit';

	// Your app's own same-origin proxy adds the geocoder key server side;
	// the browser never holds it.
	const search = geocoderSearch({ endpoint: '/geocoder/search', country: 'AU' });
</script>

<GeocoderSearch
	{search}
	bias={() => {
		const c = map?.getCenter();
		return c ? { lat: c.lat, lon: c.lng } : null;
	}}
	onSelect={(r, { pin }) => {
		map.flyTo({ center: [r.coordinates.lon, r.coordinates.lat], zoom: zoomFor(r) });
		if (pin) dropMarker(r);
	}}
/>
```

### Props

| Prop | Default | |
|---|---|---|
| `search` | required | A `SearchFn`, normally `geocoderSearch({ endpoint })`. Wrap it to add your own lookups (e.g. answer an app-specific id before falling through to the geocoder). |
| `onSelect` | required | `(result, { pin, kind })`. `pin` is false for towns (an area: move the map only) and true for addresses, places, points and environment locations. |
| `value` | `''` | Box text. Pass one-way to pre-fill (no search until the box is focused) or `bind:value`. |
| `bias` | none | `() => ({ lat, lon })`, read at search time, usually the map centre. |
| `layout` | `'dropdown'` | `'dropdown'` floats over a map; `'inline'` pushes the form down. |
| `clearOnSelect` | `false` | Empty the box after a pick instead of showing the picked text. |
| `id`, `label`, `placeholder`, `disabled` | | With a visible `<label for={id}>`, leave `label` unset. |
| `limit`, `minLength`, `debounceMs` | 6, 3, 250 | The geocoder rejects queries under 3 characters. |
| `timeoutMs`, `slowAfterMs` | 35 000, 2 000 | The geocoder's cold street path can take 6 to 10 s. |
| `kindLabel` | the kind | Chip text per result (`town`, `address`, `place`, `point`, `location`). |

### Behaviour

- Debounced search, biased to `bias()`; a newer query always wins (older in-flight requests are
  aborted, and a late response is dropped).
- Every state is shown: searching, still searching, nothing found (suggesting a single street
  number when a range like "12-14" finds nothing), and errors (geocoder unavailable,
  key rejected, timed out, unreachable).
- Keyboard: ↑/↓ to move, Enter to pick, Escape to close then clear. Enter never submits a
  surrounding form.
- ARIA combobox/listbox; password managers are told to ignore the input.

### Theming

Set any of these custom properties on an ancestor. The fallbacks are flat light-theme
values, so map them to your own tokens for dark mode.

`--fnk-bg`, `--fnk-fg`, `--fnk-muted`, `--fnk-border`, `--fnk-divider`, `--fnk-hover`,
`--fnk-accent`, `--fnk-accent-soft`, `--fnk-chip-bg`, `--fnk-error`, `--fnk-radius`,
`--fnk-height`, `--fnk-font-size`, `--fnk-ring`, `--fnk-shadow`, `--fnk-z`.

## Develop

```bash
bun install
cp .env.example .env    # GEOCODER_URL + GEOCODER_INTERNAL_KEY for the demo proxy
bun run dev             # demo page on :7014, with simulated down / slow / empty / out-of-order modes
bun run check
bun test
bun run package         # rebuilds dist/, which is committed
```

`dist/` is committed because apps install straight from GitHub and no build runs on install.
Run `bun run package` before every commit that touches `src/lib`, then tag the release.
