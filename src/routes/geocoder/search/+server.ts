/**
 * Demo-only proxy (never packaged): adds the geocoder key server side, the way every consuming
 * app's own proxy does. Configure GEOCODER_URL and GEOCODER_INTERNAL_KEY in .env.
 */
import { env } from '$env/dynamic/private';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const base = (env.GEOCODER_URL || 'http://localhost:7011').replace(/\/$/, '');
	if (!env.GEOCODER_INTERNAL_KEY) error(503, 'GEOCODER_INTERNAL_KEY is not set');
	let upstream: Response;
	try {
		upstream = await fetch(`${base}/search${url.search}`, {
			headers: { 'X-Internal-Key': env.GEOCODER_INTERNAL_KEY }
		});
	} catch {
		error(503, 'Geocoder is unavailable');
	}
	return new Response(upstream.body, {
		status: upstream.status,
		headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' }
	});
};
