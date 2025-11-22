import axiosInstance from '@/api/axiosInstance';

/**
 * AI 일일 추천 메시지 조회
 */
export const getAIDailyRecommendation = async () => {
  const response = await axiosInstance.get('/ai/daily-recommendation');
  return response.data;
};
