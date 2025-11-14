import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, Locate, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { useKakaoMap } from '@/hooks/useKakaoMap';
import { calculateDistance } from '@/utils/calculateDistance';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const LocationPickerModal = ({ isOpen, onClose, onSelectLocation, initialLocation }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const { isLoaded, error } = useKakaoMap();
  const [map, setMap] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(initialLocation);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addressName, setAddressName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const RADIUS_KM = 3; // 반경 3km

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('위치 정보를 사용할 수 없습니다'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    });
  };

  // 카카오맵 초기화
  useEffect(() => {
    if (!isOpen || !isLoaded) return;

    const initMap = async () => {
      try {
        console.log('Kakao Maps loaded, initializing map...');

        // 현재 위치 가져오기
        let location;
        try {
          location = await getCurrentLocation();
          setCurrentPosition(location);
        } catch (error) {
          console.error('현재 위치를 가져올 수 없습니다:', error);
          // 기본 위치 (대전 시청)
          location = { lat: 36.3504, lng: 127.3845 };
        }

        // 지도 생성 - initialLocation이 있으면 해당 위치 중심으로
        const centerLocation = initialLocation || location;
        const container = mapRef.current;
        const options = {
          center: new window.kakao.maps.LatLng(centerLocation.lat, centerLocation.lng),
          level: 5,
        };

        const kakaoMap = new window.kakao.maps.Map(container, options);
        setMap(kakaoMap);

        // 현재 위치 마커 표시
        new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(location.lat, location.lng),
          map: kakaoMap,
          image: new window.kakao.maps.MarkerImage(
            'data:image/svg+xml;base64,' +
              btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5f0080" stroke-width="2">
                <circle cx="12" cy="12" r="10" fill="#5f0080" fill-opacity="0.2"/>
                <circle cx="12" cy="12" r="6" fill="#5f0080"/>
              </svg>
            `),
            new window.kakao.maps.Size(32, 32),
          ),
        });

        // 반경 3km 원 표시
        const circle = new window.kakao.maps.Circle({
          center: new window.kakao.maps.LatLng(location.lat, location.lng),
          radius: RADIUS_KM * 1000, // 미터 단위
          strokeWeight: 2,
          strokeColor: '#5f0080',
          strokeOpacity: 0.8,
          strokeStyle: 'dashed',
          fillColor: '#5f0080',
          fillOpacity: 0.1,
        });
        circle.setMap(kakaoMap);
        circleRef.current = circle;

        // 지도 클릭 이벤트
        window.kakao.maps.event.addListener(kakaoMap, 'click', (mouseEvent) => {
          const clickedPosition = mouseEvent.latLng;
          const clickedLat = clickedPosition.getLat();
          const clickedLng = clickedPosition.getLng();

          // 현재 위치와의 거리 계산
          const distance = calculateDistance(location.lat, location.lng, clickedLat, clickedLng);

          if (distance > RADIUS_KM) {
            toast.error(`현재 위치에서 ${RADIUS_KM}km 이내의 장소만 선택 가능합니다.`);
            return;
          }

          // 선택 마커 업데이트
          updateSelectedMarker(clickedLat, clickedLng, kakaoMap);

          // 주소 정보 가져오기
          getAddressFromCoords(clickedLat, clickedLng);
        });
      } catch (error) {
        console.error('지도 초기화 실패:', error);
        toast.error('지도를 불러오는데 실패했습니다.');
      }
    };

    initMap();
  }, [isOpen, isLoaded, initialLocation]);

  // initialLocation이 있을 때 마커 복원
  useEffect(() => {
    if (map && initialLocation) {
      updateSelectedMarker(initialLocation.lat, initialLocation.lng, map);
      getAddressFromCoords(initialLocation.lat, initialLocation.lng);
    }
  }, [map, initialLocation]);

  // 선택 마커 업데이트
  const updateSelectedMarker = (lat, lng, kakaoMap) => {
    // 기존 마커 제거
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // 새 마커 생성
    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(lat, lng),
      map: kakaoMap,
    });

    markerRef.current = marker;
    setSelectedPosition({ lat, lng });
  };

  // 좌표로 주소 가져오기
  const getAddressFromCoords = (lat, lng) => {
    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const address = result[0].address.address_name;
        const roadAddress = result[0].road_address ? result[0].road_address.address_name : address;
        setAddressName(roadAddress);
      }
    });
  };

  // 키워드로 장소 검색
  const performSearch = useCallback(
    (keyword) => {
      if (!keyword.trim() || !map || !currentPosition) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const ps = new window.kakao.maps.services.Places();

      // 현재 위치 중심으로 검색
      const options = {
        location: new window.kakao.maps.LatLng(currentPosition.lat, currentPosition.lng),
        radius: RADIUS_KM * 1000, // 3km
        size: 10,
      };

      ps.keywordSearch(
        keyword,
        (data, status) => {
          setIsSearching(false);

          if (status === window.kakao.maps.services.Status.OK) {
            // 현재 위치 기준 3km 내의 결과만 필터링
            const filtered = data.filter((place) => {
              const distance = calculateDistance(
                currentPosition.lat,
                currentPosition.lng,
                parseFloat(place.y),
                parseFloat(place.x),
              );
              return distance <= RADIUS_KM;
            });

            setSearchResults(filtered);
          } else {
            setSearchResults([]);
          }
        },
        options,
      );
    },
    [map, currentPosition, RADIUS_KM],
  );

  // 디바운스된 검색
  const handleSearchChange = (value) => {
    setSearchKeyword(value);

    // 기존 타이머 제거
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 비어있으면 결과 초기화
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    // 새 타이머 설정 (500ms 후 검색)
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 500);
  };

  // 엔터키 검색 (즉시 검색)
  const handleSearch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    performSearch(searchKeyword);
  };

  // 검색 결과 선택
  const handleSelectSearchResult = (place) => {
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);

    // 지도 중심 이동
    const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
    map.setCenter(moveLatLng);

    // 마커 업데이트
    updateSelectedMarker(lat, lng, map);

    // 주소 설정
    setAddressName(place.road_address_name || place.address_name);

    // 검색 결과 닫기
    setSearchResults([]);
    setSearchKeyword('');
  };

  // 현재 위치로 이동
  const moveToCurrentLocation = () => {
    if (!currentPosition || !map) return;

    const moveLatLng = new window.kakao.maps.LatLng(currentPosition.lat, currentPosition.lng);
    map.setCenter(moveLatLng);
  };

  // 위치 확인 버튼
  const handleConfirm = () => {
    if (!selectedPosition) {
      toast.error('수령 장소를 선택해주세요');
      return;
    }

    onSelectLocation({
      lat: selectedPosition.lat,
      lng: selectedPosition.lng,
      address: addressName,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] max-w-3xl flex-col gap-0 bg-white p-0">
        <DialogHeader className="shrink-0 border-b-0 p-4 pb-0">
          <DialogTitle className="text-lg font-bold text-gray-800">수령 장소 선택</DialogTitle>
          <DialogDescription className="-mx-4 mt-3 bg-purple-50 p-3 text-sm text-gray-700">
            <span className="flex items-center gap-2">
              <MapPin size={16} className="shrink-0 text-[#5f0080]" />
              현재 위치에서{' '}
              <span className="font-bold text-[#5f0080]">반경 {RADIUS_KM}km 이내</span>의 장소만
              선택 가능합니다
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* 검색바 */}
        <div className="shrink-0 border-b border-gray-200 p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="장소 검색 (예: 율량동 농협)"
                className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-10 focus:border-[#5f0080] focus:ring-2 focus:ring-[#5f0080]/20 focus:outline-none"
              />
              {searchKeyword && (
                <button
                  onClick={() => {
                    setSearchKeyword('');
                    setSearchResults([]);
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current);
                    }
                  }}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="rounded-lg bg-[#5f0080] px-4 py-2 font-medium text-white hover:bg-[#4a0066] disabled:bg-gray-300"
            >
              {isSearching ? '검색중...' : '검색'}
            </button>
            <button
              onClick={moveToCurrentLocation}
              className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
              title="현재 위치로 이동"
            >
              <Locate size={20} className="text-gray-600" />
            </button>
          </div>

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {searchResults.map((place, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSearchResult(place)}
                  className="w-full border-b border-gray-100 p-3 text-left last:border-b-0 hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-800">{place.place_name}</p>
                  <p className="text-sm text-gray-600">
                    {place.road_address_name || place.address_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    현재 위치에서{' '}
                    {calculateDistance(
                      currentPosition.lat,
                      currentPosition.lng,
                      parseFloat(place.y),
                      parseFloat(place.x),
                    ).toFixed(1)}
                    km
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 선택된 주소 */}
        {addressName && (
          <div className="shrink-0 border-b border-gray-200 bg-white p-3">
            <p className="text-sm text-gray-600">선택된 장소</p>
            <p className="font-medium text-gray-800">{addressName}</p>
          </div>
        )}

        {/* 지도 */}
        <div className="relative min-h-0 flex-1">
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
              <div className="text-center">
                <p className="mb-2 font-medium text-red-600">지도를 불러올 수 없습니다</p>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
          )}
          {!isLoaded && !error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
              <div className="text-center">
                <p className="text-gray-600">지도를 불러오는 중...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="h-full w-full" />
        </div>

        {/* 하단 버튼 */}
        <div className="shrink-0 border-t border-gray-200 p-4">
          <button
            onClick={handleConfirm}
            disabled={!selectedPosition}
            className="w-full rounded-lg bg-[#5f0080] py-3 font-bold text-white hover:bg-[#4a0066] disabled:bg-gray-300"
          >
            이 위치로 선택
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPickerModal;
