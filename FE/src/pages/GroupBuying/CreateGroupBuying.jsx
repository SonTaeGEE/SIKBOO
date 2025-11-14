import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import LocationPickerModal from '@/components/GroupBuying/LocationPickerModal';
import GroupBuyingForm from '@/components/GroupBuying/GroupBuyingForm';
import { useCreateGroupBuying } from '@/hooks/useGroupBuying';
import { useCurrentUser } from '@/hooks/useUser';
import { formatNumber } from '@/utils/formatter';
import { formatKSTDateTime } from '@/utils/formatKSTDateTime';

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
    toast.success('공동구매가 생성되었습니다!');
    // replace: true로 히스토리 스택에서 생성 페이지를 대체
    // 뒤로가기 시 목록 페이지로 이동
    navigate(`/group-buying/detail/${data.groupBuyingId}`, { replace: true });
  };

  const handleMutationError = (error) => {
    console.error('공동구매 생성 실패:', error);
    toast.error(error.response?.data?.message || '공동구매 생성에 실패했습니다.');
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
      toast.error('식재료명을 입력해주세요.');
      return;
    }
    if (!selectedCategory) {
      toast.error('카테고리를 선택해주세요.');
      return;
    }
    // 숫자 파싱 (쉼표 제거)
    const totalPriceNumber = parseInt(String(formData.totalPrice).replace(/\D/g, ''), 10) || 0;
    const maxParticipantsNumber =
      parseInt(String(formData.maxParticipants).replace(/\D/g, ''), 10) || 0;

    if (totalPriceNumber <= 0) {
      toast.error('총 금액을 입력해주세요.');
      return;
    }
    if (maxParticipantsNumber <= 0) {
      toast.error('최대 인원을 입력해주세요.');
      return;
    }
    if (!selectedLocation) {
      toast.error('수령 장소를 선택해주세요.');
      return;
    }
    if (!formData.deadline) {
      toast.error('마감 시간을 선택해주세요.');
      return;
    }

    // API 요청 데이터 구성
    if (!currentUser || !currentUser.id) {
      toast.error('로그인이 필요합니다.');
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
      deadline: formatKSTDateTime(formData.deadline),
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
        <GroupBuyingForm
          formData={formData}
          selectedCategory={selectedCategory}
          selectedLocation={selectedLocation}
          onInputChange={handleInputChange}
          onFormattedInputChange={handleFormattedInputChange}
          onCategoryChange={setSelectedCategory}
          onLocationModalOpen={() => setIsLocationModalOpen(true)}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitButtonText="공동구매 만들기"
        />

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
