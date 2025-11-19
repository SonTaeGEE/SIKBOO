import { useQuery } from '@tanstack/react-query';
import { getAIDailyRecommendation } from '@/api/aiApi';

/**
 * AI 일일 추천 메시지
 */
export const useDailyRecommendation = () => {
  return useQuery({
    queryKey: ['aiDailyRecommendation'],
    queryFn: getAIDailyRecommendation,
    staleTime: 1000 * 60 * 30, // 30분 캐싱 (비용 절감)
    gcTime: 1000 * 60 * 60, // 1시간 캐시 유지
    retry: 1, // AI 실패 시 1번만 재시도
  });
};
