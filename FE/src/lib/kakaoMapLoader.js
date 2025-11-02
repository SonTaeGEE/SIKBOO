// Kakao Maps SDK를 동적으로 로드하는 유틸리티
let isScriptLoaded = false;
let isScriptLoading = false;
const loadCallbacks = [];

export const loadKakaoMapScript = () => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (isScriptLoaded && window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    // 로딩 중인 경우 콜백에 추가
    if (isScriptLoading) {
      loadCallbacks.push({ resolve, reject });
      return;
    }

    // 스크립트 로드 시작
    isScriptLoading = true;

    const script = document.createElement('script');
    const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY;

    if (!appKey) {
      const error = new Error('Kakao Maps API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      reject(error);
      loadCallbacks.forEach((cb) => cb.reject(error));
      loadCallbacks.length = 0;
      isScriptLoading = false;
      return;
    }

    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services,clusterer,drawing&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        isScriptLoaded = true;
        isScriptLoading = false;
        resolve();
        loadCallbacks.forEach((cb) => cb.resolve());
        loadCallbacks.length = 0;
      });
    };

    script.onerror = () => {
      const error = new Error('Kakao Maps 스크립트 로드에 실패했습니다.');
      isScriptLoading = false;
      reject(error);
      loadCallbacks.forEach((cb) => cb.reject(error));
      loadCallbacks.length = 0;
    };

    document.head.appendChild(script);
  });
};
