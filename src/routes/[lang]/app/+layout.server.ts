import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');
	return { user: locals.user, lang: params.lang };
};
