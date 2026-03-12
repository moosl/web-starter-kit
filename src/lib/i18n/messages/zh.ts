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
};
