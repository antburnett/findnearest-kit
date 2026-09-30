export { default as GeocoderSearch } from './geocoder/GeocoderSearch.svelte';
export {
	geocoderSearch,
	GeocoderError,
	MIN_QUERY_LENGTH,
	messageForStatus,
	kindOf,
	isSpot,
	zoomFor,
	type GeocoderResult,
	type GeocoderSource,
	type GeocoderSearchConfig,
	type ResultKind,
	type SearchFn,
	type SearchOptions
} from './geocoder/client.js';
