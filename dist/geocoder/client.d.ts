/**
 * FindNearest geocoder client: one search function the <GeocoderSearch> component calls.
 *
 * The component never knows a URL or a key. Each app passes a SearchFn, normally built here
 * against its own same-origin proxy (the proxy adds the geocoder key server side), or wraps one
 * to add its own lookups (e.g. answer an app-specific id before falling through to this).
 */
/** Where a result came from, as the geocoder reports it. Apps may add their own (e.g. 'h3'). */
export type GeocoderSource = 'gnaf' | 'linz' | 'location' | 'nominatim' | 'suburb' | 'osm_poi' | 'coordinate' | (string & {});
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
    coordinates: {
        lat: number;
        lon: number;
    };
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
    bias?: {
        lat: number;
        lon: number;
    } | null;
    signal: AbortSignal;
}
export type SearchFn = (query: string, options: SearchOptions) => Promise<GeocoderResult[]>;
/** A failed search the component can put into words. `status` is the HTTP status, 0 if none. */
export declare class GeocoderError extends Error {
    readonly status: number;
    constructor(message: string, status: number);
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
export declare const MIN_QUERY_LENGTH = 3;
/** A SearchFn for the FindNearest geocoder's /search contract. */
export declare function geocoderSearch(config: GeocoderSearchConfig): SearchFn;
export declare function messageForStatus(status: number): string;
/** What a result is, in the words shown on its chip. */
export type ResultKind = 'town' | 'address' | 'place' | 'point' | 'location';
export declare function kindOf(r: Pick<GeocoderResult, 'source'>): ResultKind;
/**
 * Whether picking this result should drop a pin. A spot (address, place, point, location) gets
 * one; a town is an area, so the map only moves.
 */
export declare function isSpot(r: Pick<GeocoderResult, 'source'>): boolean;
/** A sensible map zoom for flying to a result. */
export declare function zoomFor(r: Pick<GeocoderResult, 'source'>): number;
