/**
 * FindNearest geocoder client: one search function the <GeocoderSearch> component calls.
 *
 * The component never knows a URL or a key. Each app passes a SearchFn, normally built here
 * against its own same-origin proxy (the proxy adds the geocoder key server side), or wraps one
 * to add its own lookups (e.g. answer an app-specific id before falling through to this).
 */

/** Where a result came from, as the geocoder reports it. Apps may add their own (e.g. 'h3'). */
export type GeocoderSource =
	| 'gnaf'
	| 'linz'
	| 'location'
	| 'nominatim'
	| 'suburb'
	| 'osm_poi'
	| 'coordinate'
	| (string & {});

export interface GeocoderResult {
	source: GeocoderSource;
	source_id?: string;
	display_text: string;
	street_number?: string | null;
	street_name?: string | null;
	suburb?: string | null;
	state?: string | null;
	postcode?: string | null;
	country?: string;
	coordinates: { lat: number; lon: number };
	/** Environment locations: the location's uid (source 'location') */
	location_uid?: string;
	/** Environment locations the geocoder wants shown first */
	highlight?: boolean;
	score?: number;
	distance?: number;
}

export interface SearchOptions {
	limit: number;
	/** Rank results near this point first (usually the map centre) */
	bias?: { lat: number; lon: number } | null;
	signal: AbortSignal;
}

export type SearchFn = (query: string, options: SearchOptions) => Promise<GeocoderResult[]>;

/** A failed search the component can put into words. `status` is the HTTP status, 0 if none. */
export class GeocoderError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
		this.name = 'GeocoderError';
	}
}

export interface GeocoderSearchConfig {
	/** Search URL on the app's own proxy, e.g. '/geocoder/search' or '/api/v1/geocode' */
	endpoint: string;
	/** 'AU' or 'NZ'; omitted searches both */
	country?: 'AU' | 'NZ';
	/** Include this environment's own locations (branches, ATMs) in results */
	environmentUid?: string | (() => string | undefined);
	/** Extra request headers, for a proxy that wants them */
	headers?: Record<string, string>;
	/** Swap in a fetch (SvelteKit load, tests) */
	fetch?: typeof fetch;
}

/** The geocoder rejects queries under 3 characters with a 400. */
export const MIN_QUERY_LENGTH = 3;

/** A SearchFn for the FindNearest geocoder's /search contract. */
export function geocoderSearch(config: GeocoderSearchConfig): SearchFn {
	return async (query, { limit, bias, signal }) => {
		const params = new URLSearchParams({ q: query.trim(), limit: String(limit) });
		if (config.country) params.set('country', config.country);
		if (bias) {
			params.set('lat', bias.lat.toFixed(5));
			params.set('lon', bias.lon.toFixed(5));
		}
		const env =
			typeof config.environmentUid === 'function' ? config.environmentUid() : config.environmentUid;
		if (env) params.set('environment_uid', env);

		const sep = config.endpoint.includes('?') ? '&' : '?';
		const doFetch = config.fetch ?? fetch;
		let res: Response;
		try {
			res = await doFetch(`${config.endpoint}${sep}${params}`, {
				headers: { Accept: 'application/json', ...config.headers },
				signal
			});
		} catch (e) {
			if ((e as Error)?.name === 'AbortError') throw e;
			throw new GeocoderError('Geocoder unreachable', 0);
		}
		if (!res.ok) throw new GeocoderError(messageForStatus(res.status), res.status);

		const body = (await res.json()) as { results?: GeocoderResult[] };
		return (body.results ?? []).map(normalise);
	};
}

export function messageForStatus(status: number): string {
	if (status === 401 || status === 403) return 'Geocoder rejected the key';
	if (status === 502 || status === 503 || status === 504) return 'Geocoder unavailable';
	if (status === 400) return 'Geocoder could not read that search';
	return `Geocoder error ${status}`;
}

/** Older geocoder builds sent GNAF coordinates as strings. */
function normalise(r: GeocoderResult): GeocoderResult {
	return { ...r, coordinates: { lat: Number(r.coordinates.lat), lon: Number(r.coordinates.lon) } };
}

/** What a result is, in the words shown on its chip. */
export type ResultKind = 'town' | 'address' | 'place' | 'point' | 'location';

export function kindOf(r: Pick<GeocoderResult, 'source'>): ResultKind {
	switch (r.source) {
		case 'suburb':
			return 'town';
		case 'osm_poi':
		case 'nominatim':
			return 'place';
		case 'coordinate':
			return 'point';
		case 'location':
			return 'location';
		default:
			return 'address';
	}
}

/**
 * Whether picking this result should drop a pin. A spot (address, place, point, location) gets
 * one; a town is an area, so the map only moves.
 */
export function isSpot(r: Pick<GeocoderResult, 'source'>): boolean {
	return kindOf(r) !== 'town';
}

/** A sensible map zoom for flying to a result. */
export function zoomFor(r: Pick<GeocoderResult, 'source'>): number {
	const kind = kindOf(r);
	return kind === 'town' ? 14 : kind === 'address' || kind === 'location' ? 17 : 16;
}
