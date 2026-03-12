import { config } from '$lib/config';
import { en } from './messages/en';
import { zh } from './messages/zh';
import { ja } from './messages/ja';
import { ko } from './messages/ko';
import type { Messages } from './messages/en';

const messages: Record<string, Messages> = { en, zh, ja, ko };

export function getMessages(locale: string): Messages {
	return messages[locale] ?? messages[config.i18n.defaultLocale];
}

export function t(locale: string, key: string): string {
	const msg = getMessages(locale);
	const parts = key.split('.');
	let result: any = msg;
	for (const part of parts) {
		result = result?.[part];
	}
	return typeof result === 'string' ? result : key;
}

export function isValidLocale(locale: string): boolean {
	return (config.i18n.locales as readonly string[]).includes(locale);
}

export function detectLocale(acceptLanguage: string | null): string {
	if (!acceptLanguage) return config.i18n.defaultLocale;
	const preferred = acceptLanguage
		.split(',')
		.map((part) => part.split(';')[0].trim().split('-')[0])
		.find((lang) => isValidLocale(lang));
	return preferred ?? config.i18n.defaultLocale;
}
