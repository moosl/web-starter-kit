import { describe, it, expect } from 'vitest';
import { getMessages, t, isValidLocale, detectLocale } from '../index';
import { en } from '../messages/en';
import { zh } from '../messages/zh';
import { ja } from '../messages/ja';
import { ko } from '../messages/ko';

describe('i18n', () => {
	describe('getMessages', () => {
		it('returns English messages for "en"', () => {
			const msg = getMessages('en');
			expect(msg).toBe(en);
		});

		it('returns Chinese messages for "zh"', () => {
			const msg = getMessages('zh');
			expect(msg).toBe(zh);
		});

		it('returns Japanese messages for "ja"', () => {
			const msg = getMessages('ja');
			expect(msg).toBe(ja);
		});

		it('returns Korean messages for "ko"', () => {
			const msg = getMessages('ko');
			expect(msg).toBe(ko);
		});

		it('falls back to English for unknown locale', () => {
			const msg = getMessages('fr');
			expect(msg).toBe(en);
		});

		it('falls back to English for empty string', () => {
			const msg = getMessages('');
			expect(msg).toBe(en);
		});
	});

	describe('t (dot-path translation)', () => {
		it('resolves simple key', () => {
			expect(t('en', 'landing.title')).toBe('AI Image Generator');
		});

		it('resolves nested key', () => {
			expect(t('en', 'gallery.status.pending')).toBe('Processing');
		});

		it('returns key itself for missing path', () => {
			expect(t('en', 'nonexistent.key')).toBe('nonexistent.key');
		});

		it('returns key for partially valid path leading to object', () => {
			expect(t('en', 'landing')).toBe('landing');
		});

		it('works with non-English locales', () => {
			expect(t('zh', 'landing.title')).toBe('AI 图片生成器');
			expect(t('ja', 'landing.title')).toBe('AI画像ジェネレーター');
			expect(t('ko', 'landing.title')).toBe('AI 이미지 생성기');
		});
	});

	describe('isValidLocale', () => {
		it('accepts valid locales', () => {
			expect(isValidLocale('en')).toBe(true);
			expect(isValidLocale('zh')).toBe(true);
			expect(isValidLocale('ja')).toBe(true);
			expect(isValidLocale('ko')).toBe(true);
		});

		it('rejects invalid locales', () => {
			expect(isValidLocale('fr')).toBe(false);
			expect(isValidLocale('de')).toBe(false);
			expect(isValidLocale('')).toBe(false);
			expect(isValidLocale('EN')).toBe(false);
			expect(isValidLocale('english')).toBe(false);
		});
	});

	describe('detectLocale', () => {
		it('returns default for null accept-language', () => {
			expect(detectLocale(null)).toBe('en');
		});

		it('returns default for empty string', () => {
			expect(detectLocale('')).toBe('en');
		});

		it('detects Chinese', () => {
			expect(detectLocale('zh-CN,zh;q=0.9,en;q=0.8')).toBe('zh');
		});

		it('detects Japanese', () => {
			expect(detectLocale('ja,en-US;q=0.9')).toBe('ja');
		});

		it('detects Korean', () => {
			expect(detectLocale('ko-KR,ko;q=0.9,en;q=0.8')).toBe('ko');
		});

		it('detects English', () => {
			expect(detectLocale('en-US,en;q=0.9')).toBe('en');
		});

		it('falls back to default for unsupported language', () => {
			expect(detectLocale('fr-FR,fr;q=0.9,de;q=0.8')).toBe('en');
		});

		it('picks first matching locale from quality-sorted list', () => {
			expect(detectLocale('fr;q=0.9,ja;q=0.8,ko;q=0.7')).toBe('ja');
		});
	});

	describe('message structure consistency', () => {
		function getKeys(obj: any, prefix = ''): string[] {
			const keys: string[] = [];
			for (const key of Object.keys(obj)) {
				const fullKey = prefix ? `${prefix}.${key}` : key;
				if (typeof obj[key] === 'object' && obj[key] !== null) {
					keys.push(...getKeys(obj[key], fullKey));
				} else {
					keys.push(fullKey);
				}
			}
			return keys.sort();
		}

		const enKeys = getKeys(en);

		it('zh has the same keys as en', () => {
			expect(getKeys(zh)).toEqual(enKeys);
		});

		it('ja has the same keys as en', () => {
			expect(getKeys(ja)).toEqual(enKeys);
		});

		it('ko has the same keys as en', () => {
			expect(getKeys(ko)).toEqual(enKeys);
		});

		it('all values are non-empty strings', () => {
			for (const [name, messages] of Object.entries({ en, zh, ja, ko })) {
				const keys = getKeys(messages);
				for (const key of keys) {
					const val = t(name, key);
					expect(val, `${name}.${key} should be a non-empty string`).toBeTruthy();
					expect(typeof val).toBe('string');
					expect(val).not.toBe(key); // should resolve, not return key itself
				}
			}
		});
	});
});
