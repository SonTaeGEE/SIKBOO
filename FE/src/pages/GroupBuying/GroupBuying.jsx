import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Clock, Plus, Search, ShoppingBag } from 'lucide-react';
import { getTimeRemaining } from '@/lib/dateUtils';
import { useKakaoMap } from '@/hooks/useKakaoMap';
import { useActiveGroupBuyings, useMyParticipatingGroupBuyings } from '@/hooks/useGroupBuying';
import { useCurrentUser } from '@/hooks/useUser';

const GroupBuying = () => {
  const navigate = useNavigate();
  const { isLoaded } = useKakaoMap();
  const [location, setLocation] = useState('위치를 가져오는 중...');
  const [currentPosition, setCurrentPosition] = useState(null); // { lat, lng }
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('recruiting'); // 'recruiting' or 'joined'
  const [distanceFilter, setDistanceFilter] = useState('5'); // '1', '3', '5', '7', '10'

  // 로그인한 사용자 정보 가져오기
  const { data: currentUser } = useCurrentUser();

  // 모집중인 공동구매 목록 조회 (recruiting 탭일 때만)
  const { data: activeGroupBuyings = [], isLoading: isLoadingActive } = useActiveGroupBuyings({
    enabled: activeTab === 'recruiting',
  });

  // 내가 참여한 공동구매 목록 조회 (joined 탭일 때만, currentUser가 있을 때만)
  const { data: myParticipatingGroupBuyings = [], isLoading: isLoadingMy } =
    useMyParticipatingGroupBuyings(currentUser?.id, {
      enabled: activeTab === 'joined' && !!currentUser?.id,
    });

  // 카테고리 정의
  const categories = [
    { id: 'all', name: '전체', icon: '🛒' },
    { id: 'FRUIT', name: '과일', icon: '🍎' },
    { id: 'VEGETABLE', name: '채소', icon: '🥕' },
    { id: 'MEAT', name: '육류', icon: '🥩' },
    { id: 'SEAFOOD', name: '수산물', icon: '🐟' },
    { id: 'DAIRY', name: '유제품', icon: '🥛' },
    { id: 'ETC', name: '기타', icon: '🥚' },
  ];

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

  // Haversine 공식을 이용한 거리 계산 (km 단위)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km
  };

  // 현재 탭에 따라 데이터 선택
  const currentItems =
    activeTab === 'recruiting' ? activeGroupBuyings : myParticipatingGroupBuyings;

  // 필터링된 아이템 (거리 정보 포함)
  const filteredItems = currentItems
    .map((item) => {
      // 거리 계산
      let distance = null;
      if (currentPosition && item.pickupLatitude && item.pickupLongitude) {
        distance = calculateDistance(
          currentPosition.lat,
          currentPosition.lng,
          item.pickupLatitude,
          item.pickupLongitude,
        );
      }
      return { ...item, distance };
    })
    .filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === 'all' || item.category === category;

      // 거리 필터링
      let matchesDistance = true;
      if (item.distance !== null) {
        const maxDistance = parseFloat(distanceFilter);
        matchesDistance = item.distance <= maxDistance;
      }

      return matchesSearch && matchesCategory && matchesDistance;
    });

  // 로딩 상태
  const isLoading = activeTab === 'recruiting' ? isLoadingActive : isLoadingMy;

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
              onChange={(e) => setSearchQuery(e.target.value)}
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
            onClick={() => setActiveTab('recruiting')}
            className={`flex-1 rounded-md py-2.5 text-sm font-medium transition ${
              activeTab === 'recruiting'
                ? 'bg-[#5f0080] text-white'
                : 'text-[#666666] hover:bg-gray-50'
            }`}
          >
            모집중인 공동구매
          </button>
          <button
            onClick={() => setActiveTab('joined')}
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
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
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
              <span className="text-[#5f0080]">{filteredItems.length}</span>
            </h3>
          </div>

          {isLoading ? (
            <div className="rounded-lg bg-gray-50 py-16 text-center">
              <p className="text-sm text-gray-500">로딩 중...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-lg bg-gray-50 py-16 text-center">
              <p className="text-sm text-gray-500">
                {activeTab === 'recruiting'
                  ? '모집중인 공동구매가 없습니다.'
                  : '참여한 공동구매가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredItems.map((item) => {
                return (
                  <div
                    key={item.groupBuyingId}
                    onClick={() => navigate(`/group-buying/detail/${item.groupBuyingId}`)}
                    className="cursor-pointer overflow-hidden rounded-lg border border-[#e0e0e0] bg-white transition hover:shadow-lg"
                  >
                    {/* Product Info */}
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="line-clamp-1 flex-1 text-lg font-medium text-[#333333]">
                          {item.title}
                        </h4>
                        {item.status === '모집중' ? (
                          <div className="ml-2 rounded-full bg-[#5f0080] px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
                            모집중
                          </div>
                        ) : (
                          <div className="ml-2 rounded-full bg-[#999999] px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
                            마감
                          </div>
                        )}
                      </div>

                      <div className="mb-2 flex items-center gap-2 text-xs text-[#999999]">
                        <MapPin size={11} />
                        <span>{item.pickupLocation}</span>
                        {activeTab === 'recruiting' && (
                          <>
                            <span>·</span>
                            <span>
                              {item.distance !== null
                                ? `${item.distance.toFixed(1)}km`
                                : '거리 계산중'}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mb-2 flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-[#666666]">
                          <Users size={13} className="text-[#5f0080]" />
                          <span>
                            {item.currentPeople}/{item.maxPeople}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[#666666]">
                          <Clock size={13} className="text-[#ff6b6b]" />
                          {getTimeRemaining(item.deadline) === '마감' ? (
                            <span>마감까지</span>
                          ) : (
                            <span>마감까지 {getTimeRemaining(item.deadline)}</span>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-[#f4f4f4] pt-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500">1인당 예상 가격</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-gray-900">
                                {(item.totalPrice / item.maxPeople).toLocaleString()}원
                              </span>
                              <span className="text-sm text-gray-400 line-through">
                                {item.totalPrice.toLocaleString()}원
                              </span>
                            </div>
                          </div>
                          <ShoppingBag size={18} className="text-[#5f0080]" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
