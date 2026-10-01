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
import { type GeocoderResult, type ResultKind, type SearchFn } from './client.js';
interface Props {
    /** Runs a search; build one with geocoderSearch() */
    search: SearchFn;
    /** A result was picked */
    onSelect: (result: GeocoderResult, info: {
        pin: boolean;
        kind: ResultKind;
    }) => void;
    /** The box text. Pass one-way to pre-fill (it never searches until focused), or bind it. */
    value?: string;
    /** Point to rank results near, read at search time (e.g. the map centre) */
    bias?: () => {
        lat: number;
        lon: number;
    } | null | undefined;
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
declare const GeocoderSearch: import("svelte").Component<Props, {}, "value">;
type GeocoderSearch = ReturnType<typeof GeocoderSearch>;
export default GeocoderSearch;
