import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

import LocationPickerModal from '@/components/LocationPickerModal';
import { useCreateGroupBuying } from '@/hooks/useGroupBuying';
import { useCurrentUser } from '@/hooks/useUser';
import { CATEGORY } from '@/constants/category';
import { formatNumber } from '@/utils/formatter';

const CreateGroupBuying = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    totalPrice: '',
    maxParticipants: '',
    deadline: '',
    description: '',
  });
  // 로그인한 사용자 ID 가져오기
  const { data: currentUser } = useCurrentUser();

  // 공동구매 생성 Mutation
  const createMutation = useCreateGroupBuying();

  // 성공/에러 처리
  const handleMutationSuccess = (data) => {
    alert('공동구매가 생성되었습니다!');
    navigate(`/group-buying/detail/${data.groupBuyingId}`);
  };

  const handleMutationError = (error) => {
    console.error('공동구매 생성 실패:', error);
    alert(error.response?.data?.message || '공동구매 생성에 실패했습니다.');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 입력 처리: totalPrice는 포맷 적용, maxParticipants는 숫자만 허용
  const handleFormattedInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'totalPrice') {
      setFormData((prev) => ({ ...prev, totalPrice: formatNumber(value) }));
      return;
    }
    if (name === 'maxParticipants') {
      // 숫자만 허용
      const digits = String(value).replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, maxParticipants: digits }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleSubmit = () => {
    // 유효성 검사
    if (!formData.name.trim()) {
      alert('식재료명을 입력해주세요.');
      return;
    }
    if (!selectedCategory) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    // 숫자 파싱 (쉼표 제거)
    const totalPriceNumber = parseInt(String(formData.totalPrice).replace(/\D/g, ''), 10) || 0;
    const maxParticipantsNumber =
      parseInt(String(formData.maxParticipants).replace(/\D/g, ''), 10) || 0;

    if (totalPriceNumber <= 0) {
      alert('총 금액을 입력해주세요.');
      return;
    }
    if (maxParticipantsNumber <= 0) {
      alert('최대 인원을 입력해주세요.');
      return;
    }
    if (!selectedLocation) {
      alert('수령 장소를 선택해주세요.');
      return;
    }
    if (!formData.deadline) {
      alert('마감 시간을 선택해주세요.');
      return;
    }

    // API 요청 데이터 구성
    if (!currentUser || !currentUser.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    const requestData = {
      memberId: currentUser.id,
      title: formData.name,
      category: selectedCategory,
      totalPrice: totalPriceNumber,
      maxPeople: maxParticipantsNumber,
      info: formData.description,
      pickupLocation: selectedLocation.address,
      pickupLatitude: selectedLocation.lat,
      pickupLongitude: selectedLocation.lng,
      deadline: new Date(formData.deadline).toISOString(),
    };

    // Mutation 실행
    createMutation.mutate(requestData, {
      onSuccess: handleMutationSuccess,
      onError: handleMutationError,
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
              {CATEGORY.map((category) => {
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
                type="text"
                name="totalPrice"
                value={formData.totalPrice}
                onChange={handleFormattedInputChange}
                inputMode="numeric"
                placeholder="50,000"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">최대 인원</label>
              <input
                type="text"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleFormattedInputChange}
                inputMode="numeric"
                placeholder="5"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
              />
            </div>
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
            disabled={createMutation.isPending}
            className="w-full rounded-xl bg-[#5f0080] py-4 text-lg font-bold text-white transition hover:bg-[#4a0066] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending ? '생성 중...' : '공동구매 만들기'}
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
