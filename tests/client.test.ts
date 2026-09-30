import { describe, expect, test } from 'bun:test';
import { geocoderSearch, GeocoderError, isSpot, kindOf, zoomFor } from '../src/lib/geocoder/client.js';

function fakeFetch(status: number, body: unknown, seen: string[] = []) {
	return (async (url: string) => {
		seen.push(url);
		return new Response(JSON.stringify(body), { status });
	}) as unknown as typeof fetch;
}

const signal = new AbortController().signal;

describe('geocoderSearch', () => {
	test('builds the query, bias and environment params', async () => {
		const seen: string[] = [];
		const search = geocoderSearch({
			endpoint: '/geocoder/search',
			country: 'AU',
			environmentUid: () => 'abcdefghjkmn',
			fetch: fakeFetch(200, { results: [] }, seen)
		});
		await search('  kempsey ', { limit: 6, bias: { lat: -31.0809, lon: 152.8287 }, signal });
		const u = new URL(seen[0], 'http://x');
		expect(u.pathname).toBe('/geocoder/search');
		expect(u.searchParams.get('q')).toBe('kempsey');
		expect(u.searchParams.get('limit')).toBe('6');
		expect(u.searchParams.get('country')).toBe('AU');
		expect(u.searchParams.get('lat')).toBe('-31.08090');
		expect(u.searchParams.get('lon')).toBe('152.82870');
		expect(u.searchParams.get('environment_uid')).toBe('abcdefghjkmn');
	});

	test('appends to an endpoint that already has a query string', async () => {
		const seen: string[] = [];
		const search = geocoderSearch({ endpoint: '/api/geo?x=1', fetch: fakeFetch(200, {}, seen) });
		await search('abc', { limit: 3, signal });
		expect(seen[0].startsWith('/api/geo?x=1&q=abc')).toBe(true);
	});

	test('coerces string coordinates to numbers', async () => {
		const search = geocoderSearch({
			endpoint: '/g',
			fetch: fakeFetch(200, {
				results: [{ source: 'gnaf', display_text: 'X', coordinates: { lat: '-31.1', lon: '152.8' } }]
			})
		});
		const [r] = await search('xyz', { limit: 1, signal });
		expect(r.coordinates).toEqual({ lat: -31.1, lon: 152.8 });
	});

	test('throws a GeocoderError that says what went wrong', async () => {
		for (const [status, message] of [
			[503, 'Geocoder unavailable'],
			[401, 'Geocoder rejected the key'],
			[500, 'Geocoder error 500']
		] as const) {
			const search = geocoderSearch({ endpoint: '/g', fetch: fakeFetch(status, {}) });
			const err = await search('xyz', { limit: 1, signal }).catch((e: any) => e);
			expect(err).toBeInstanceOf(GeocoderError);
			expect(err.message).toBe(message);
			expect(err.status).toBe(status);
		}
	});

	test('a network failure is "unreachable", an abort stays an abort', async () => {
		const down = geocoderSearch({
			endpoint: '/g',
			fetch: (async () => {
				throw new TypeError('fetch failed');
			}) as unknown as typeof fetch
		});
		expect((await down('xyz', { limit: 1, signal }).catch((e: any) => e)).message).toBe('Geocoder unreachable');

		const aborted = geocoderSearch({
			endpoint: '/g',
			fetch: (async () => {
				throw new DOMException('aborted', 'AbortError');
			}) as unknown as typeof fetch
		});
		expect((await aborted('xyz', { limit: 1, signal }).catch((e: any) => e)).name).toBe('AbortError');
	});
});

describe('kinds', () => {
	test('labels, pins and zooms', () => {
		expect(kindOf({ source: 'suburb' })).toBe('town');
		expect(kindOf({ source: 'osm_poi' })).toBe('place');
		expect(kindOf({ source: 'coordinate' })).toBe('point');
		expect(kindOf({ source: 'location' })).toBe('location');
		expect(kindOf({ source: 'gnaf' })).toBe('address');
		expect(isSpot({ source: 'suburb' })).toBe(false);
		expect(isSpot({ source: 'gnaf' })).toBe(true);
		expect(zoomFor({ source: 'suburb' })).toBe(14);
		expect(zoomFor({ source: 'osm_poi' })).toBe(16);
		expect(zoomFor({ source: 'gnaf' })).toBe(17);
	});
});
