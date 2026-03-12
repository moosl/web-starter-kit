import { error } from '@sveltejs/kit';
import { isValidLocale } from '$lib/i18n';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals }) => {
	if (!isValidLocale(params.lang)) {
		throw error(404, 'Not found');
	}
	return {
		lang: params.lang,
		user: locals.user,
	};
};
