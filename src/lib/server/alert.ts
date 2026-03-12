import { config } from '$lib/config';

export async function sendAlert(
	env: App.Platform['env'],
	subject: string,
	body: string,
): Promise<void> {
	const alertEmail = env.ALERT_EMAIL || config.alert.email;
	if (!alertEmail) return;

	const key = `alert:count:${Math.floor(Date.now() / 3600000)}`;
	const count = parseInt((await env.KV.get(key)) ?? '0');
	if (count >= config.alert.maxPerHour) return;

	await env.KV.put(key, String(count + 1), { expirationTtl: 3600 });

	await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from: 'alert@yourdomain.com',
			to: alertEmail,
			subject: `[Alert] ${subject}`,
			text: body,
		}),
	});
}
