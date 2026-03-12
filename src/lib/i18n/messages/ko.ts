import type { Messages } from './en';

export const ko: Messages = {
	landing: {
		title: 'AI 이미지 생성기',
		subtitle: 'AI로 멋진 이미지를 만들어보세요',
		cta: '시작하기',
	},
	nav: {
		home: '홈',
		pricing: '요금',
		login: '로그인',
		app: '대시보드',
		gallery: '갤러리',
		account: '계정',
		logout: '로그아웃',
	},
	auth: {
		loginWithGoogle: 'Google로 로그인',
		loginRequired: '로그인이 필요합니다',
	},
	app: {
		promptPlaceholder: '생성할 이미지를 설명해주세요...',
		generate: '생성',
		generating: '생성 중...',
		credits: '크레딧',
		noCredits: '크레딧이 부족합니다',
		uploadRef: '참조 이미지 업로드',
	},
	gallery: {
		title: '내 갤러리',
		empty: '아직 이미지가 없습니다. 첫 번째 이미지를 만들어보세요!',
		status: {
			pending: '처리 중',
			done: '완료',
			failed: '실패',
		},
	},
	account: {
		title: '계정',
		plan: '플랜',
		credits: '크레딧',
		syncOrders: '주문 동기화',
	},
	pricing: {
		title: '요금제',
		free: '무료',
		freeDesc: '10 크레딧 제공',
		starter: '스타터',
		starterDesc: '100 크레딧',
		pro: '프로',
		proDesc: '500 크레딧',
		buy: '구매하기',
	},
	billing: {
		success: '결제 완료! 크레딧이 추가되었습니다.',
		cancelled: '결제가 취소되었습니다.',
	},
	errors: {
		notFound: '페이지를 찾을 수 없습니다',
		serverError: '문제가 발생했습니다',
		tryAgain: '다시 시도',
		goHome: '홈으로 돌아가기',
	},
	footer: {
		privacy: '개인정보처리방침',
		terms: '이용약관',
	},
};
