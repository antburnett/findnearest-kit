# findnearest-kit

Shared FindNearest UI for Svelte 5 apps:

- **Base CSS**: design tokens, light and dark mode, base element styles and the `fn-*`
  utility and component classes. Plain CSS, no CSS framework.
- **`GeocoderSearch`**: the place search box for the FindNearest geocoder, used by FindNearest
  Admin, ANTS, Shifter, Thematrix and the public client sites instead of each keeping its own
  copy.

## Install

Installed from GitHub at a tag (not published to npm):

```bash
bun add github:antburnett/findnearest-kit#v0.2.1
```

Requires `svelte` 5.20 or later. Upgrading means bumping the tag.

## Base CSS

Import it once, from the root layout's stylesheet:

```css
@import 'findnearest-kit/fn.css';
```

or, when the app has global rules of its own that must sit at a set point in the cascade:

```css
@import 'findnearest-kit/fn-core.css'; /* tokens, dark mode, base elements, fn-* classes */
@import './app-base.css';              /* the app's own globals */
@import 'findnearest-kit/fn-late.css'; /* toast, flat Option A overrides */
@import 'findnearest-kit/fn-last.css'; /* rules that must win: fn-hidden, fn-sm-* ... */
```

**Dark mode:** set `data-mode="dark"` on `<html>` (before first paint, from `localStorage.theme`
or the system setting). Every token switches; `color-scheme` follows.

**Colours in app CSS:** use the tokens, never a bare hex, and dark mode comes for free.

| Token | Use |
|---|---|
| `--fn-color-body`, `-body-muted`, `-body-faint` | text |
| `--fn-color-bg-surface` | the page |
| `--fn-color-bg-page`, `-bg-elevated` | cards, panels, inputs |
| `--fn-color-bg-muted`, `-bg-accent` | table heads, hover, subtle fills |
| `--fn-color-bg-inverse` + `--fn-color-on-solid` | dark chip with white text |
| `--fn-color-border`, `-border-strong`, `-border-focus`, `-divide` | lines |
| `--fn-color-link`, `-link-strong` | links |
| `--fn-color-{primary,secondary,tertiary,success,warning,error,surface}-{50…950}` | the scales |
| `--fn-tint-{primary,success,warning,error,tertiary,orange,fuchsia,teal}-{bg,border,text}` | pastel badges and callouts |

## Use GeocoderSearch

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
| `search` | required | A `SearchFn`, normally `geocoderSearch({ endpoint })`. Wrap it to add your own lookups (ANTS answers H3 cell ids itself). |
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
- Every state is shown: searching, still searching, nothing found (with a hint for ranges like
  "68-70 Elbow Street", which the geocoder doesn't match yet), and errors (geocoder unavailable,
  key rejected, timed out, unreachable).
- Keyboard: ↑/↓ to move, Enter to pick, Escape to close then clear. Enter never submits a
  surrounding form.
- ARIA combobox/listbox; password managers are told to ignore the input.

### Theming

Set any of these custom properties on an ancestor. The fallbacks are the flat FindNearest
"Option A" light values, so map them to your own tokens for dark mode.

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
