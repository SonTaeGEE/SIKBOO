import { useState } from 'react';
import { Apple, Beef, Fish, Egg, Milk, Carrot, MapPin } from 'lucide-react';
import LocationPickerModal from '@/components/LocationPickerModal';

const CreateGroupBuying = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    totalPrice: '',
    maxParticipants: '',
    quantity: '',
    radius: '5',
    deadline: '',
    description: '',
  });

  const categories = [
    { id: 'fruit', icon: Apple, label: '과일', color: 'text-[#5f0080]' },
    { id: 'vegetable', icon: Carrot, label: '채소', color: 'text-orange-600' },
    { id: 'meat', icon: Beef, label: '육류', color: 'text-red-600' },
    { id: 'seafood', icon: Fish, label: '수산물', color: 'text-blue-600' },
    { id: 'dairy', icon: Milk, label: '유제품', color: 'text-sky-600' },
    { id: 'etc', icon: Egg, label: '기타', color: 'text-yellow-600' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleSubmit = () => {
    // TODO: API 연동
    console.log('공동구매 생성:', {
      ...formData,
      category: selectedCategory,
      location: selectedLocation,
    });
  };

  return (
    <div className="mx-auto min-h-full max-w-2xl p-4">
      <div className="space-y-4">
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">식재료명</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
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
                name="totalPrice"
                value={formData.totalPrice}
                onChange={handleInputChange}
                placeholder="50,000"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">최대 인원</label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                placeholder="5"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">총 수량</label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="예: 5kg 또는 10개"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              수령 장소
              <span className="ml-1 text-xs font-normal text-gray-500">
                (현재 위치 기준 3km 이내)
              </span>
            </label>
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className={`flex w-full items-center gap-2 rounded-lg border ${
                selectedLocation ? 'border-[#5f0080] bg-purple-50' : 'border-gray-200'
              } px-4 py-3 text-left transition hover:border-[#5f0080] hover:bg-purple-50`}
            >
              <MapPin size={20} className={selectedLocation ? 'text-[#5f0080]' : 'text-gray-400'} />
              <div className="flex-1">
                {selectedLocation ? (
                  <div>
                    <p className="font-medium text-gray-800">{selectedLocation.address}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">지도에서 수령 장소를 선택해주세요</p>
                )}
              </div>
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">마감 시간</label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              마감 시간 이후에는 새로운 참여가 불가능합니다
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">상세 설명 (선택)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="예: 제주 직송 한라봉입니다. 신선도 보장합니다!"
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-xl bg-[#5f0080] py-4 text-lg font-bold text-white transition hover:bg-[#4a0066]"
          >
            공동구매 만들기
          </button>
        </div>

        {/* 위치 선택 모달 */}
        <LocationPickerModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onSelectLocation={handleLocationSelect}
          initialLocation={selectedLocation}
        />
      </div>
    </div>
  );
};

export default CreateGroupBuying;
