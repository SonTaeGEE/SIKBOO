// Kakao Maps SDK를 동적으로 로드하는 유틸리티
let isScriptLoaded = false;
let isScriptLoading = false;
const loadCallbacks = [];

export const loadKakaoMapScript = () => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (isScriptLoaded && window.kakao && window.kakao.maps) {
      console.log('✅ Kakao Maps already loaded');
      resolve();
      return;
    }

    // 로딩 중인 경우 콜백에 추가
    if (isScriptLoading) {
      console.log('⏳ Kakao Maps loading in progress, adding to queue');
      loadCallbacks.push({ resolve, reject });
      return;
    }

    // 스크립트 로드 시작
    isScriptLoading = true;
    console.log('🚀 Starting to load Kakao Maps script');

    const script = document.createElement('script');
    const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY;

    if (!appKey) {
      const error = new Error('Kakao Maps API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      console.error('❌', error.message);
      reject(error);
      loadCallbacks.forEach((cb) => cb.reject(error));
      loadCallbacks.length = 0;
      isScriptLoading = false;
      return;
    }

    console.log('🔑 API Key:', appKey.substring(0, 10) + '...');

    // autoload=false 제거하고 직접 로드
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services,clusterer,drawing&autoload=false`;
    script.async = true;
    script.type = 'text/javascript';

    script.onload = () => {
      console.log('📦 Kakao script loaded, initializing maps...');

      // kakao 객체가 로드될 때까지 대기
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          console.log('✅ Kakao Maps initialized successfully');
          isScriptLoaded = true;
          isScriptLoading = false;
          resolve();
          loadCallbacks.forEach((cb) => cb.resolve());
          loadCallbacks.length = 0;
        });
      } else {
        const error = new Error('Kakao Maps 객체를 찾을 수 없습니다.');
        console.error('❌', error.message);
        isScriptLoading = false;
        reject(error);
        loadCallbacks.forEach((cb) => cb.reject(error));
        loadCallbacks.length = 0;
      }
    };

    script.onerror = (e) => {
      const error = new Error('Kakao Maps 스크립트 로드에 실패했습니다.');
      console.error('❌', error.message, e);
      isScriptLoading = false;
      reject(error);
      loadCallbacks.forEach((cb) => cb.reject(error));
      loadCallbacks.length = 0;
    };

    document.head.appendChild(script);
  });
};
