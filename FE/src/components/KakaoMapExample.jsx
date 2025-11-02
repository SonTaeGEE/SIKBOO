import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { useKakaoMap } from '../hooks/useKakaoMap';

const KakaoMapExample = () => {
  const { isLoaded, error } = useKakaoMap();
  
  // 기본 위치: 청주시 흥덕구 율량동
  const defaultPosition = {
    lat: 36.6424,
    lng: 127.4890,
  };

  if (error) {
    return (
      <div className="flex h-96 w-full items-center justify-center rounded-lg bg-red-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-96 w-full items-center justify-center rounded-lg bg-gray-100">
        <p className="text-gray-500">지도를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="h-96 w-full overflow-hidden rounded-lg">
      <Map
        center={defaultPosition}
        style={{ width: '100%', height: '100%' }}
        level={3}
      >
        <MapMarker position={defaultPosition}>
          <div style={{ padding: '5px', color: '#000' }}>율량동</div>
        </MapMarker>
      </Map>
    </div>
  );
};

export default KakaoMapExample;
