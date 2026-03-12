declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				email: string;
				name: string;
				avatarUrl: string | null;
				credits: number;
				plan: string;
			} | null;
			session: { id: string; expiresAt: Date } | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
				R2: R2Bucket;
				KV: KVNamespace;
				GOOGLE_CLIENT_ID: string;
				GOOGLE_CLIENT_SECRET: string;
				CREEM_API_KEY: string;
				CREEM_WEBHOOK_SECRET: string;
				REPLICATE_API_TOKEN: string;
				RESEND_API_KEY: string;
				TURNSTILE_SECRET_KEY: string;
				R2_ACCESS_KEY_ID: string;
				R2_SECRET_ACCESS_KEY: string;
				R2_ENDPOINT: string;
			};
			context: {
				waitUntil(promise: Promise<any>): void;
			};
		}
	}
}
export {};
