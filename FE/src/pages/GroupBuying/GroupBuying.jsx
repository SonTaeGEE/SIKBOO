import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Plus, Search } from 'lucide-react';

import { useKakaoMap } from '@/hooks/useKakaoMap';
import {
  useInfiniteGroupBuyings,
  useInfiniteMyParticipatingGroupBuyings,
} from '@/hooks/useGroupBuying';
import { useCurrentUser } from '@/hooks/useUser';
import { GROUP_BUYING_CATEGORY } from '@/constants/category';
import GroupBuyingCard from '@/components/GroupBuying/GroupBuyingCard';
import Loading from '@/components/common/Loading';

const GroupBuying = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoaded } = useKakaoMap();
  const [location, setLocation] = useState('위치를 가져오는 중...');
  const [currentPosition, setCurrentPosition] = useState(null); // { lat, lng }
  const [distanceFilter, setDistanceFilter] = useState('5'); // '1', '3', '5', '7', '10' (UI 상태만)

  // QueryString에서 검색어, 카테고리, 탭 가져오기
  const searchQuery = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const activeTab = searchParams.get('tab') || 'recruiting';

  // QueryString 업데이트 헬퍼 함수
  const updateQueryString = (updates) => {
    const newParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    setSearchParams(newParams, { replace: true });
  };

  // 검색어 변경
  const handleSearchChange = (value) => {
    updateQueryString({ search: value, category, tab: activeTab });
  };

  // 카테고리 변경
  const handleCategoryChange = (newCategory) => {
    updateQueryString({ search: searchQuery, category: newCategory, tab: activeTab });
  };

  // 탭 변경
  const handleTabChange = (newTab) => {
    updateQueryString({ search: searchQuery, category, tab: newTab });
  };

  // 무한 스크롤 감지용 ref
  const observerTarget = useRef(null);

  // 로그인한 사용자 정보 가져오기
  const { data: currentUser } = useCurrentUser();

  // 모집중인 공동구매 무한 스크롤 조회 (recruiting 탭일 때만)
  const {
    data: infiniteRecruitingData,
    isLoading: isLoadingActive,
    isFetchingNextPage: isFetchingNextRecruiting,
    hasNextPage: hasNextRecruiting,
    fetchNextPage: fetchNextRecruiting,
  } = useInfiniteGroupBuyings(
    {
      search: searchQuery || undefined,
      category: category === 'all' ? undefined : category,
      status: 'RECRUITING',
      lat: currentPosition?.lat,
      lng: currentPosition?.lng,
      distance: parseFloat(distanceFilter),
      pageSize: 20,
    },
    {
      enabled: activeTab === 'recruiting', // recruiting 탭일 때만 데이터 가져오기
    },
  );

  // 내가 참여한 공동구매 무한 스크롤 조회 (joined 탭일 때만)
  const {
    data: infiniteMyData,
    isLoading: isLoadingMy,
    isFetchingNextPage: isFetchingNextMy,
    hasNextPage: hasNextMy,
    fetchNextPage: fetchNextMy,
  } = useInfiniteMyParticipatingGroupBuyings(
    {
      memberId: currentUser?.id,
      search: searchQuery || undefined,
      category: category === 'all' ? undefined : category,
      pageSize: 20,
    },
    {
      enabled: activeTab === 'joined' && !!currentUser?.id, // joined 탭이고 사용자 ID가 있을 때만 데이터 가져오기
    },
  );

  // 현재 위치 가져오기
  useEffect(() => {
    if (!isLoaded) return;

    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        setLocation('위치 정보를 사용할 수 없습니다');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // 현재 위치 저장
          setCurrentPosition({ lat, lng });

          // 카카오맵 geocoder로 주소 변환
          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.coord2Address(lng, lat, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const address = result[0].address;
              // 시/구/동 형식으로 표시
              const displayAddress = `${address.region_1depth_name} ${address.region_2depth_name} ${address.region_3depth_name}`;
              setLocation(displayAddress);
            } else {
              setLocation('주소를 가져올 수 없습니다');
            }
          });
        },
        (error) => {
          console.error('위치 가져오기 실패:', error);
          setLocation('위치 정보를 가져올 수 없습니다');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    };

    getCurrentLocation();
  }, [isLoaded]);

  // 무한 스크롤 IntersectionObserver 설정
  useEffect(() => {
    const hasNext = activeTab === 'recruiting' ? hasNextRecruiting : hasNextMy;
    const isFetching = activeTab === 'recruiting' ? isFetchingNextRecruiting : isFetchingNextMy;
    const fetchNext = activeTab === 'recruiting' ? fetchNextRecruiting : fetchNextMy;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !isFetching) {
          fetchNext();
        }
      },
      { threshold: 0.1 },
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [
    activeTab,
    hasNextRecruiting,
    hasNextMy,
    isFetchingNextRecruiting,
    isFetchingNextMy,
    fetchNextRecruiting,
    fetchNextMy,
  ]);

  // 현재 탭에 따라 데이터 선택
  const currentItems =
    activeTab === 'recruiting'
      ? infiniteRecruitingData?.items || [] // 모집중인 공동구매 (거리 계산 포함, 백엔드 필터링)
      : infiniteMyData?.items || []; // 내 공동구매 (백엔드 필터링)

  // 로딩 상태
  const isLoading = activeTab === 'recruiting' ? isLoadingActive : isLoadingMy;

  // 현재 탭의 무한 스크롤 상태
  const isFetchingNextPage =
    activeTab === 'recruiting' ? isFetchingNextRecruiting : isFetchingNextMy;

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-4">
        {/* Location */}
        <div className="mb-4 flex items-center justify-end gap-1 text-sm text-[#666666]">
          <MapPin size={14} className="text-[#5f0080]" />
          <span>{location}</span>
        </div>

        {/* Search Bar - Kurly Style */}
        <div className="mb-4">
          <div className="relative">
            <Search
              className="absolute top-1/2 left-4 -translate-y-1/2 transform text-[#999999]"
              size={18}
            />
            <input
              type="text"
              placeholder="검색어를 입력해주세요"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-[#e0e0e0] bg-white py-3 pr-4 pl-11 text-[#333333] placeholder-[#999999] focus:border-[#5f0080] focus:outline-none"
            />
          </div>
        </div>

        {/* Banner - Kurly Style */}
        <div className="mb-4 rounded-lg bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="mb-1 text-lg font-bold text-[#333333]">
                지금 우리 동네에서
                <br />
                <span className="text-[#5f0080]">신선한 식재료</span>를 함께 구매하세요
              </h2>
              <p className="text-xs text-[#666666]">함께 사면 더 저렴하게, 더 신선하게</p>
            </div>
          </div>
        </div>

        {/* Main Tabs - 모집중 / 내 공동구매 */}
        <div className="mb-4 flex gap-2 rounded-lg bg-white p-1 shadow-sm">
          <button
            onClick={() => handleTabChange('recruiting')}
            className={`flex-1 rounded-md py-2.5 text-sm font-medium transition ${
              activeTab === 'recruiting'
                ? 'bg-[#5f0080] text-white'
                : 'text-[#666666] hover:bg-gray-50'
            }`}
          >
            모집중인 공동구매
          </button>
          <button
            onClick={() => handleTabChange('joined')}
            className={`flex-1 rounded-md py-2.5 text-sm font-medium transition ${
              activeTab === 'joined' ? 'bg-[#5f0080] text-white' : 'text-[#666666] hover:bg-gray-50'
            }`}
          >
            내 공동구매
          </button>
        </div>

        {/* Category Tabs - Kurly Style */}
        <div className="-mx-4 mb-4 px-4">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-[#e0e0e0] pb-2">
            {GROUP_BUYING_CATEGORY.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 font-medium whitespace-nowrap transition ${
                  category === cat.id
                    ? 'border-[#5f0080] text-[#5f0080]'
                    : 'border-transparent text-[#666666]'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="text-sm">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Distance Filter */}
        {activeTab === 'recruiting' && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#666666]">거리:</span>
              <div className="flex gap-2">
                {[
                  { id: '1', label: '1km' },
                  { id: '3', label: '3km' },
                  { id: '5', label: '5km' },
                  { id: '7', label: '7km' },
                  { id: '10', label: '10km' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setDistanceFilter(filter.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      distanceFilter === filter.id
                        ? 'bg-[#5f0080] text-white'
                        : 'bg-gray-100 text-[#666666] hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Product Grid - Kurly Style */}
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#333333]">
              {activeTab === 'recruiting' ? '모집중인 공동구매' : '내 공동구매'}{' '}
              <span className="text-[#5f0080]">{currentItems.length}</span>
            </h3>
          </div>

          {isLoading ? (
            <Loading message="공동구매 목록을 불러오는 중..." />
          ) : currentItems.length === 0 ? (
            <div className="rounded-lg bg-gray-50 py-16 text-center">
              <p className="text-sm text-gray-500">
                {activeTab === 'recruiting'
                  ? '모집중인 공동구매가 없습니다.'
                  : '참여한 공동구매가 없습니다.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3">
                {currentItems.map((item) => (
                  <GroupBuyingCard
                    key={item.groupBuyingId}
                    item={item}
                    showDistance={activeTab === 'recruiting'}
                  />
                ))}
              </div>

              {/* 무한 스크롤 로딩 인디케이터 */}
              {isFetchingNextPage && (
                <div className="mt-4 text-center">
                  <Loading message="더 불러오는 중..." />
                </div>
              )}
              {/* IntersectionObserver 타겟 */}
              <div ref={observerTarget} className="h-4" />
            </>
          )}
        </div>

        {/* Floating Button */}
        <button
          onClick={() => navigate('/group-buying/create')}
          className="fixed right-4 bottom-20 rounded-full bg-[#5f0080] p-4 text-white shadow-xl transition-all hover:scale-110 hover:bg-[#4a0066]"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
};

export default GroupBuying;
