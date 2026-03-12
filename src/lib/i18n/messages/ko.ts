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
	seo: {
		landing: {
			description:
				'몇 초 만에 놀라운 AI 이미지를 생성하세요. Flux 1.1 Pro 기반, 간단한 크레딧 시스템. 지금 무료로 체험하세요.',
		},
		pricing: {
			description:
				'나에게 맞는 요금제를 선택하세요. 무료 10 크레딧으로 시작하거나 업그레이드하여 더 많은 AI 이미지를 생성하세요.',
		},
		privacy: {
			title: '개인정보처리방침',
			description: '개인정보의 수집, 사용 및 보호에 대해 알아보세요.',
		},
		terms: {
			title: '이용약관',
			description: 'AI 이미지 생성 서비스 이용 약관을 확인하세요.',
		},
	},
	privacy: {
		title: '개인정보처리방침',
		lastUpdated: '최종 업데이트: 2026년 3월',
		sections: [
			{
				heading: '수집하는 정보',
				content:
					'Google OAuth를 통해 계정을 생성할 때 이름, 이메일 주소, 프로필 사진 등의 정보를 수집합니다. 또한 생성된 이미지, 소비된 크레딧, 결제 내역 등의 사용 데이터도 수집합니다.',
			},
			{
				heading: '정보 사용 방법',
				content:
					'귀하의 정보는 서비스 제공 및 개선, 결제 처리, 계정 및 크레딧 관리, 중요한 업데이트 전달에 사용됩니다. 개인 데이터를 제3자에게 판매하지 않습니다.',
			},
			{
				heading: '데이터 저장 및 보안',
				content:
					'데이터는 Cloudflare 인프라에 안전하게 저장됩니다. 생성된 이미지는 암호화된 객체 스토리지에 보관됩니다. 세션 데이터는 해시 처리되며 30일 후 만료됩니다. 업계 표준 보안 조치를 사용합니다.',
			},
			{
				heading: '제3자 서비스',
				content:
					'다음 제3자 서비스를 사용합니다: 인증을 위한 Google OAuth, AI 이미지 생성을 위한 Replicate, 결제 처리를 위한 Creem, 호스팅 및 CDN을 위한 Cloudflare. 각 서비스에는 자체 개인정보처리방침이 있습니다.',
			},
			{
				heading: '귀하의 권리',
				content:
					'언제든지 연락하여 개인 데이터의 접근, 수정 또는 삭제를 요청할 수 있습니다. 계정을 삭제하면 개인 정보와 생성된 이미지가 제거됩니다.',
			},
			{
				heading: '문의',
				content:
					'본 개인정보처리방침에 대한 질문이 있으시면 웹사이트에 기재된 이메일 주소로 문의해 주세요.',
			},
		],
	},
	terms: {
		title: '이용약관',
		lastUpdated: '최종 업데이트: 2026년 3월',
		sections: [
			{
				heading: '약관 동의',
				content:
					'본 서비스에 접근하거나 사용함으로써 이 약관에 동의하는 것으로 간주됩니다. 동의하지 않는 경우 서비스를 사용하지 마세요.',
			},
			{
				heading: '계정 책임',
				content:
					'계정의 보안을 유지할 책임은 사용자에게 있습니다. 로그인 정보를 공유하지 마세요. 계정에서 발생하는 모든 활동에 대한 책임은 사용자에게 있습니다.',
			},
			{
				heading: '크레딧 및 결제',
				content:
					'이미지 생성 시 크레딧이 차감됩니다. 생성 실패 시 크레딧이 자동으로 환불됩니다. 구매한 크레딧은 환불 불가하지만 만료되지 않습니다. 가격은 합리적인 사전 통보 후 변경될 수 있습니다.',
			},
			{
				heading: '이용 규칙',
				content:
					'불법적이거나 유해하거나 권리를 침해하는 콘텐츠를 생성하는 데 서비스를 사용해서는 안 됩니다. 이 정책을 위반하는 계정을 사전 통보 없이 정지할 권리를 보유합니다.',
			},
			{
				heading: '지적 재산권',
				content:
					'본 서비스를 사용하여 생성한 이미지의 소유권은 사용자에게 있습니다. 생성된 콘텐츠에 대한 권리를 주장하지 않습니다. 서비스 자체(디자인 및 코드 포함)는 당사의 지적 재산입니다.',
			},
			{
				heading: '책임 제한',
				content:
					'서비스는 "있는 그대로" 제공되며 어떠한 보증도 하지 않습니다. 서비스 사용으로 인한 간접적, 부수적 또는 결과적 손해에 대해 책임을 지지 않습니다.',
			},
			{
				heading: '약관 변경',
				content:
					'이 약관은 수시로 업데이트될 수 있습니다. 변경 후 서비스를 계속 사용하면 새 약관에 동의한 것으로 간주됩니다. 중요한 변경 사항은 이메일로 알려드립니다.',
			},
		],
	},
};
