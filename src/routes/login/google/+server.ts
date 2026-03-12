import { redirect } from '@sveltejs/kit';
import { generateState, generateCodeVerifier } from 'arctic';
import { createGoogleOAuth } from '$lib/server/auth/google';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, platform, url }) => {
	const env = platform!.env;
	const google = createGoogleOAuth(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		`${url.origin}/login/google/callback`,
	);

	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const authUrl = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

	cookies.set('google_oauth_state', state, {
		path: '/',
		secure: true,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax',
	});
	cookies.set('google_code_verifier', codeVerifier, {
		path: '/',
		secure: true,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax',
	});

	throw redirect(302, authUrl.toString());
};
