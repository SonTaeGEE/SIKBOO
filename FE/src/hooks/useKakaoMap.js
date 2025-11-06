import { useEffect, useState } from 'react';
import { loadKakaoMapScript } from '@/lib/kakaoMapLoader';

/**
 * Kakao Map을 사용하기 위한 커스텀 훅
 * @returns {Object} { isLoaded, error }
 */
export const useKakaoMap = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadKakaoMapScript()
      .then(() => setIsLoaded(true))
      .catch((err) => setError(err.message));
  }, []);

  return { isLoaded, error };
};
