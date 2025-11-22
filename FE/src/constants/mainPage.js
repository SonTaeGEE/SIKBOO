export const HERO_SLIDES = [
  {
    kicker: '오늘 뭐 먹지 고민 끝',
    title: '냉장고 속 재료로 바로 만드는 레시피',
    description: '있는 재료만 골라 AI가 오늘 한 끼 레시피를 추천해줘요.',
    primaryAction: {
      label: '내 재료 선택하고 시작하기',
      path: '/ingredients',
    },
    secondaryAction: {
      label: '바로 레시피 보러가기',
      path: '/recipes',
    },
    iconName: 'ChefHat',
  },
  {
    kicker: '장보기 귀찮은 날',
    title: '1~2개만 더 사면 되는 레시피',
    description: '추가 재료를 최소화해서 장보기도, 요리도 가볍게.',
    primaryAction: {
      label: '필요한 재료만 확인하기',
      path: '/recipes?filter=need',
    },
    secondaryAction: null,
    iconName: 'ShoppingBag',
  },
  {
    kicker: '버리기 전에 맛있게',
    title: '유통기한 임박 재료로 해결하는 한 끼',
    description: '곧 버려야 할 재료를 먼저 쓰는 레시피를 추천해 드려요.',
    primaryAction: {
      label: '임박 재료 확인하기',
      path: '/ingredients?filter=expiring',
    },
    secondaryAction: null,
    iconName: 'Refrigerator',
  },
];

export const QUICK_ACTIONS = [
  {
    iconName: 'Refrigerator',
    title: '내 식재료 관리',
    description: '냉장고 속 재료를 한 번에 확인해요.',
    path: '/ingredients',
    colorClass: 'bg-violet-500',
  },
  {
    iconName: 'ChefHat',
    title: 'AI 레시피 생성',
    description: '재료만 고르면 레시피를 만들어줘요.',
    path: '/recipes',
    colorClass: 'bg-purple-500',
  },
  {
    iconName: 'ShoppingCart',
    title: '공동구매',
    description: '많이 쓰는 재료를 같이 사요.',
    path: '/group-buying',
    colorClass: 'bg-emerald-500',
  },
];
