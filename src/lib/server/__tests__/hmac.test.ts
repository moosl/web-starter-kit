import { describe, it, expect } from 'vitest';

// Extract and test the HMAC verification logic used in creem webhook
async function verifyCreemSignature(
	body: string,
	signature: string,
	secret: string,
): Promise<boolean> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
	const expected = Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return expected === signature;
}

async function computeHmac(body: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
	return Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

describe('HMAC-SHA256 Signature Verification', () => {
	const secret = 'test-webhook-secret';
	const body = '{"event":"checkout.completed","object":{"id":"order_123"}}';

	it('verifies a valid signature', async () => {
		const signature = await computeHmac(body, secret);
		const valid = await verifyCreemSignature(body, signature, secret);
		expect(valid).toBe(true);
	});

	it('rejects an invalid signature', async () => {
		const valid = await verifyCreemSignature(body, 'invalid-signature', secret);
		expect(valid).toBe(false);
	});

	it('rejects when body is tampered', async () => {
		const signature = await computeHmac(body, secret);
		const tamperedBody = body.replace('order_123', 'order_456');
		const valid = await verifyCreemSignature(tamperedBody, signature, secret);
		expect(valid).toBe(false);
	});

	it('rejects when secret differs', async () => {
		const signature = await computeHmac(body, secret);
		const valid = await verifyCreemSignature(body, signature, 'wrong-secret');
		expect(valid).toBe(false);
	});

	it('handles empty body', async () => {
		const signature = await computeHmac('', secret);
		const valid = await verifyCreemSignature('', signature, secret);
		expect(valid).toBe(true);
	});

	it('produces consistent signatures', async () => {
		const sig1 = await computeHmac(body, secret);
		const sig2 = await computeHmac(body, secret);
		expect(sig1).toBe(sig2);
	});

	it('produces 64-char hex string', async () => {
		const sig = await computeHmac(body, secret);
		expect(sig).toMatch(/^[a-f0-9]{64}$/);
	});
});
