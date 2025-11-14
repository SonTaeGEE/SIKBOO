import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import LocationPickerModal from '@/components/GroupBuying/LocationPickerModal';
import GroupBuyingForm from '@/components/GroupBuying/GroupBuyingForm';
import { useGroupBuying, useUpdateGroupBuying } from '@/hooks/useGroupBuying';
import { useCurrentUser } from '@/hooks/useUser';
import { formatNumber } from '@/utils/formatter';
import { formatKSTDateTime } from '@/utils/formatKSTDateTime';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';

const EditGroupBuying = () => {
  const { id } = useParams();
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

  // 로그인한 사용자 정보
  const { data: currentUser } = useCurrentUser();

  // 공동구매 상세 정보 가져오기
  const { data: groupBuying, isLoading, error } = useGroupBuying(id);

  // 공동구매 수정 Mutation
  const updateMutation = useUpdateGroupBuying();

  // 공동구매 데이터 로드 시 폼 초기화
  useEffect(() => {
    if (groupBuying) {
      // 주최자 확인
      if (currentUser && groupBuying.memberId !== currentUser.id) {
        toast.error('수정 권한이 없습니다.');
        navigate(`/group-buying/detail/${id}`);
        return;
      }

      // 폼 데이터 설정
      setFormData({
        name: groupBuying.title || '',
        totalPrice: formatNumber(String(groupBuying.totalPrice || '')),
        maxParticipants: String(groupBuying.maxPeople || ''),
        deadline: groupBuying.deadline ? groupBuying.deadline.slice(0, 16) : '',
        description: groupBuying.info || '',
      });

      // 카테고리 설정
      setSelectedCategory(groupBuying.category || '');

      // 위치 설정
      if (groupBuying.pickupLatitude && groupBuying.pickupLongitude) {
        setSelectedLocation({
          lat: groupBuying.pickupLatitude,
          lng: groupBuying.pickupLongitude,
          address: groupBuying.pickupLocation,
        });
      }
    }
  }, [groupBuying, currentUser, id, navigate]);

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

    // 현재 참여 인원보다 적게 설정할 수 없음
    if (groupBuying && maxParticipantsNumber < groupBuying.currentPeople) {
      toast.error(
        `최대 인원은 현재 참여 인원(${groupBuying.currentPeople}명)보다 작을 수 없습니다.`,
      );
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
    const requestData = {
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
    updateMutation.mutate(
      { id, data: requestData },
      {
        onSuccess: () => {
          toast.success('공동구매가 수정되었습니다!');
          navigate(`/group-buying/detail/${id}`);
        },
        onError: (error) => {
          console.error('공동구매 수정 실패:', error);
          toast.error(error.response?.data?.message || '공동구매 수정에 실패했습니다.');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl p-4">
        <Loading message="공동구매 정보를 불러오는 중..." />
      </div>
    );
  }

  if (error || !groupBuying) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl p-4">
        <EmptyState
          message="공동구매 정보를 불러올 수 없습니다."
          onBack={() => navigate('/group-buying')}
        />
      </div>
    );
  }

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
          onCancel={() => navigate(`/group-buying/detail/${id}`)}
          isSubmitting={updateMutation.isPending}
          submitButtonText="수정 완료"
          showCurrentPeople={true}
          currentPeople={groupBuying?.currentPeople || 0}
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

export default EditGroupBuying;
