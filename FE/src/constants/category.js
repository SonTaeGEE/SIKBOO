import { Apple, Beef, Fish, Egg, Milk, Carrot } from 'lucide-react';

export const CATEGORY = [
  { id: 'FRUIT', icon: Apple, label: '과일', color: 'text-[#5f0080]' },
  { id: 'VEGETABLE', icon: Carrot, label: '채소', color: 'text-orange-600' },
  { id: 'MEAT', icon: Beef, label: '육류', color: 'text-red-600' },
  { id: 'SEAFOOD', icon: Fish, label: '수산물', color: 'text-blue-600' },
  { id: 'DAIRY', icon: Milk, label: '유제품', color: 'text-sky-600' },
  { id: 'ETC', icon: Egg, label: '기타', color: 'text-yellow-600' },
];

export const GROUP_BUYING_CATEGORY = [
  { id: 'all', name: '전체', icon: '🛒' },
  { id: 'FRUIT', name: '과일', icon: '🍎' },
  { id: 'VEGETABLE', name: '채소', icon: '🥕' },
  { id: 'MEAT', name: '육류', icon: '🥩' },
  { id: 'SEAFOOD', name: '수산물', icon: '🐟' },
  { id: 'DAIRY', name: '유제품', icon: '🥛' },
  { id: 'ETC', name: '기타', icon: '🥚' },
];
