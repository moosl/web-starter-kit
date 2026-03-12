import type { Messages } from './en';

export const ja: Messages = {
	landing: {
		title: 'AI画像ジェネレーター',
		subtitle: 'AIで素晴らしい画像を作成',
		cta: '始める',
	},
	nav: {
		home: 'ホーム',
		pricing: '料金',
		login: 'ログイン',
		app: 'ダッシュボード',
		gallery: 'ギャラリー',
		account: 'アカウント',
		logout: 'ログアウト',
	},
	auth: {
		loginWithGoogle: 'Googleでログイン',
		loginRequired: 'ログインしてください',
	},
	app: {
		promptPlaceholder: '作成したい画像を説明してください...',
		generate: '生成',
		generating: '生成中...',
		credits: 'クレジット',
		noCredits: 'クレジットがありません',
		uploadRef: '参考画像をアップロード',
	},
	gallery: {
		title: 'マイギャラリー',
		empty: 'まだ画像がありません。最初の一枚を作りましょう！',
		status: {
			pending: '処理中',
			done: '完了',
			failed: '失敗',
		},
	},
	account: {
		title: 'アカウント',
		plan: 'プラン',
		credits: 'クレジット',
		syncOrders: '注文を同期',
	},
	pricing: {
		title: '料金プラン',
		free: '無料',
		freeDesc: '10クレジット付き',
		starter: 'スターター',
		starterDesc: '100クレジット',
		pro: 'プロ',
		proDesc: '500クレジット',
		buy: '購入する',
	},
	billing: {
		success: '支払い成功！クレジットが追加されました。',
		cancelled: '支払いがキャンセルされました。',
	},
	errors: {
		notFound: 'ページが見つかりません',
		serverError: '問題が発生しました',
		tryAgain: '再試行',
		goHome: 'ホームに戻る',
	},
	footer: {
		privacy: 'プライバシーポリシー',
		terms: '利用規約',
	},
};
