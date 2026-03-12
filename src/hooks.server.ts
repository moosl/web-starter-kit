import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { validateSession, SESSION_COOKIE, sessionCookieOptions } from '$lib/server/auth/session';
import { config } from '$lib/config';
import { isValidLocale, detectLocale } from '$lib/i18n';
import { sendAlert } from '$lib/server/alert';

const handleAuth: Handle = async ({ event, resolve }) => {
	if (!config.features.auth) {
		return resolve(event);
	}

	const env = event.platform?.env;
	if (!env) return resolve(event);

	const token = event.cookies.get(SESSION_COOKIE);
	if (!token) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await validateSession(env.DB, token);

	if (session?.fresh) {
		event.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(session.expiresAt));
	}
	if (!session) {
		event.cookies.delete(SESSION_COOKIE, { path: '/' });
	}

	event.locals.user = user;
	event.locals.session = session ? { id: session.id, expiresAt: session.expiresAt } : null;

	return resolve(event);
};

const handleI18n: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname.startsWith('/api/') || pathname.startsWith('/login') || pathname.startsWith('/.well-known')) {
		return resolve(event);
	}

	const segments = pathname.split('/').filter(Boolean);
	const firstSegment = segments[0];

	if (!firstSegment || !isValidLocale(firstSegment)) {
		const locale = detectLocale(event.request.headers.get('accept-language'));
		const target = `/${locale}${pathname === '/' ? '' : pathname}`;
		throw redirect(301, target);
	}

	return resolve(event);
};

const handleProtectedRoutes: Handle = async ({ event, resolve }) => {
	if (!config.features.auth) return resolve(event);

	const { pathname } = event.url;
	if (/^\/[a-z]{2}\/app(\/|$)/.test(pathname) && !event.locals.user) {
		throw redirect(302, '/login');
	}

	return resolve(event);
};

const handleSecurityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set(
		'Content-Security-Policy',
		"default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.r2.cloudflarestorage.com https://*.googleusercontent.com; connect-src 'self' https://*.google-analytics.com https://*.r2.cloudflarestorage.com; frame-src https://challenges.cloudflare.com",
	);
	return response;
};

export const handle = sequence(handleAuth, handleI18n, handleProtectedRoutes, handleSecurityHeaders);

export const handleError: HandleServerError = ({ error, event }) => {
	if (event.url.pathname.includes('.well-known')) {
		return { message: 'Not Found', code: 'NOT_FOUND' };
	}

	console.error('Unhandled error:', error);

	const env = event.platform?.env;
	if (env) {
		event.platform?.context.waitUntil(
			(async () => {
				await env.DB.prepare(
					'INSERT INTO error_logs (id, type, message, url, created_at) VALUES (?, ?, ?, ?, ?)',
				)
					.bind(crypto.randomUUID(), 'unhandled', String(error), event.url.pathname, Date.now())
					.run();

				await sendAlert(env, 'Unhandled Error', `URL: ${event.url.pathname}\nError: ${String(error)}`);
			})(),
		);
	}

	return {
		message: 'Something went wrong',
		code: 'INTERNAL_ERROR',
	};
};
