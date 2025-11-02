import { useState } from 'react';
import { Apple, Beef, Fish, Egg, Milk, Carrot } from 'lucide-react';

const CreateGroupBuying = () => {
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    { id: 'fruit', icon: Apple, label: '과일', color: 'text-[#5f0080]' },
    { id: 'vegetable', icon: Carrot, label: '채소', color: 'text-orange-600' },
    { id: 'meat', icon: Beef, label: '육류', color: 'text-red-600' },
    { id: 'seafood', icon: Fish, label: '수산물', color: 'text-blue-600' },
    { id: 'dairy', icon: Milk, label: '유제품', color: 'text-sky-600' },
    { id: 'etc', icon: Egg, label: '기타', color: 'text-yellow-600' },
  ];

  return (
    <div className="mx-auto min-h-full max-w-2xl p-4">
      <div className="space-y-4">
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">식재료명</label>
            <input
              type="text"
              placeholder="예: 제주 한라봉 5kg"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">카테고리</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition ${
                      isSelected
                        ? 'border-[#5f0080] bg-purple-50'
                        : 'border-gray-200 hover:border-[#5f0080] hover:bg-purple-50'
                    }`}
                  >
                    <Icon size={24} className={category.color} />
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">총 금액</label>
              <input
                type="number"
                placeholder="50,000"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">최대 인원</label>
              <input
                type="number"
                placeholder="5"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">총 수량</label>
            <input
              type="text"
              placeholder="예: 5kg 또는 10개"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">수령 장소</label>
            <input
              type="text"
              placeholder="예: 율량동 농협 앞"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              모집 반경
              <span className="ml-1 text-xs font-normal text-gray-500">(수령 장소 기준)</span>
            </label>
            <select className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none">
              <option value="1">1km 이내</option>
              <option value="5" selected>
                5km 이내
              </option>
              <option value="10">10km 이내</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              설정한 반경 내의 사용자만 공동구매에 참여할 수 있습니다
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">마감 시간</label>
            <select className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none">
              <option>1시간 후</option>
              <option>3시간 후</option>
              <option>6시간 후</option>
              <option>12시간 후</option>
              <option>1일 후</option>
              <option>2일 후</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">상세 설명 (선택)</label>
            <textarea
              rows={4}
              placeholder="예: 제주 직송 한라봉입니다. 신선도 보장합니다!"
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
            />
          </div>

          <button className="w-full rounded-xl bg-[#5f0080] py-4 text-lg font-bold text-white transition hover:bg-[#4a0066]">
            공동구매 만들기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupBuying;
