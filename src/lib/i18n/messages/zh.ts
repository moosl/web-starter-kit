import type { Messages } from './en';

export const zh: Messages = {
	landing: {
		title: 'AI 图片生成器',
		subtitle: '用 AI 创造令人惊艳的图片',
		cta: '立即开始',
	},
	nav: {
		home: '首页',
		pricing: '定价',
		login: '登录',
		app: '工作台',
		gallery: '图库',
		account: '账户',
		logout: '退出',
	},
	auth: {
		loginWithGoogle: '使用 Google 登录',
		loginRequired: '请先登录',
	},
	app: {
		promptPlaceholder: '描述你想生成的图片...',
		generate: '生成',
		generating: '生成中...',
		credits: '积分',
		noCredits: '积分不足',
		uploadRef: '上传参考图',
	},
	gallery: {
		title: '我的图库',
		empty: '还没有图片，创建第一张吧！',
		status: {
			pending: '处理中',
			done: '完成',
			failed: '失败',
		},
	},
	account: {
		title: '账户',
		plan: '套餐',
		credits: '积分',
		syncOrders: '同步订单',
	},
	pricing: {
		title: '定价',
		free: '免费',
		freeDesc: '赠送 10 积分',
		starter: '入门版',
		starterDesc: '100 积分',
		pro: '专业版',
		proDesc: '500 积分',
		buy: '立即购买',
	},
	billing: {
		success: '支付成功！积分已到账。',
		cancelled: '支付已取消。',
	},
	errors: {
		notFound: '页面未找到',
		serverError: '出了点问题',
		tryAgain: '重试',
		goHome: '回到首页',
	},
	footer: {
		privacy: '隐私政策',
		terms: '服务条款',
	},
	seo: {
		landing: {
			description: '几秒内生成令人惊艳的 AI 图片。基于 Flux 1.1 Pro，简单的积分制。立即免费试用。',
		},
		pricing: {
			description: '选择适合你的方案。免费赠送 10 积分，或升级获取更多 AI 图片生成次数。',
		},
		privacy: {
			title: '隐私政策',
			description: '了解我们如何收集、使用和保护您的个人信息。',
		},
		terms: {
			title: '服务条款',
			description: '阅读使用我们 AI 图片生成服务的条款和条件。',
		},
	},
	privacy: {
		title: '隐私政策',
		lastUpdated: '最后更新：2026 年 3 月',
		sections: [
			{
				heading: '我们收集的信息',
				content:
					'当您通过 Google OAuth 创建账户时，我们会收集您提供的信息，包括姓名、电子邮件地址和头像。我们还会收集使用数据，如生成的图片、消耗的积分和支付记录。',
			},
			{
				heading: '我们如何使用您的信息',
				content:
					'您的信息用于提供和改进服务、处理支付、管理您的账户和积分，以及传达重要更新。我们不会将您的个人数据出售给第三方。',
			},
			{
				heading: '数据存储与安全',
				content:
					'您的数据安全存储在 Cloudflare 基础设施上。生成的图片存储在加密的对象存储中。会话数据经过哈希处理，30 天后过期。我们采用行业标准的安全措施来保护您的信息。',
			},
			{
				heading: '第三方服务',
				content:
					'我们使用以下第三方服务：Google OAuth 用于身份验证，Replicate 用于 AI 图片生成，Creem 用于支付处理，Cloudflare 用于托管和 CDN。每个服务都有自己的隐私政策。',
			},
			{
				heading: '您的权利',
				content:
					'您可以随时联系我们请求访问、更正或删除您的个人数据。您也可以删除账户，这将移除您的个人信息和生成的图片。',
			},
			{
				heading: '联系我们',
				content: '如果您对本隐私政策有任何疑问，请通过我们网站上列出的电子邮件联系我们。',
			},
		],
	},
	terms: {
		title: '服务条款',
		lastUpdated: '最后更新：2026 年 3 月',
		sections: [
			{
				heading: '接受条款',
				content: '访问或使用本服务即表示您同意受这些条款的约束。如果您不同意，请不要使用本服务。',
			},
			{
				heading: '账户责任',
				content:
					'您有责任维护账户的安全性。请勿分享您的登录凭证。您对账户下的所有活动承担责任。',
			},
			{
				heading: '积分与支付',
				content:
					'生成图片时会扣除积分。如果生成失败，积分将自动退还。已购买的积分不可退款但不会过期。价格可能会在合理通知后发生变化。',
			},
			{
				heading: '合理使用',
				content:
					'您不得使用本服务生成非法、有害或侵权的内容。我们保留在不事先通知的情况下暂停违反此政策的账户的权利。',
			},
			{
				heading: '知识产权',
				content:
					'您保留使用我们服务生成的图片的所有权。我们不主张对您生成的内容享有权利。服务本身，包括其设计和代码，仍为我们的知识产权。',
			},
			{
				heading: '责任限制',
				content:
					'本服务按"现状"提供，不作任何保证。我们不对因您使用本服务而产生的任何间接、附带或后果性损害承担责任。',
			},
			{
				heading: '条款变更',
				content:
					'我们可能会不时更新这些条款。在变更后继续使用本服务即表示接受新条款。我们将通过电子邮件通知用户重大变更。',
			},
		],
	},
};
