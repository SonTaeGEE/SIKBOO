// src/api/recipeApi.js
import axiosInstance from '@/api/axiosInstance';

// 공통 타임아웃: AI 응답이 10초를 넘겨 'canceled' 되는 문제를 방지 (기본 45초)
const LONG_TIMEOUT = 45_000;

const recipeApi = {
  /** 생성 탭: 내 재료 */
  fetchMyIngredients: async () => {
    const { data } = await axiosInstance.get('/ingredients/my', {
      // 목록은 빠르게 응답되므로 기본값 사용
      withCredentials: true,
    });
    return Array.isArray(data) ? data : [];
  },

  /** 레시피 생성(= 방 생성): { id, title, createdAt } */
  generateRecipes: async (ingredientIds) => {
    // AI 호출이 10초를 초과해 axios 기본/인스턴스 타임아웃에 의해 취소(canceled)되는 현상 대응
    const { data } = await axiosInstance.post(
      '/recipes/generate',
      { ingredientIds },
      {
        timeout: LONG_TIMEOUT, // ← 핵심 수정
        withCredentials: true,
      },
    );
    return data;
  },

  /** 방 목록 */
  listSessions: async () => {
    const { data } = await axiosInstance.get('/recipes/sessions', {
      withCredentials: true,
    });
    return Array.isArray(data) ? data : [];
  },

  /** 방 상세 */
  getSessionDetail: async (sessionId) => {
    const { data } = await axiosInstance.get(`/recipes/sessions/${sessionId}`, {
      timeout: LONG_TIMEOUT, // 상세도 AI 생성 직후 파싱 지연 대비 여유를 둠
      withCredentials: true,
    });
    return data || {};
  },

  /**
   * 다른 레시피 추천받기 (세션 기준)
   * filter: 'have' | 'need' | undefined
   */
  recommendMore: async (sessionId, filter) => {
    const params = {};
    if (filter) params.filter = filter;
    const { data } = await axiosInstance.post(
      `/recipes/sessions/${sessionId}/recommend-more`,
      {},
      {
        params,
        timeout: LONG_TIMEOUT,
        withCredentials: true,
      },
    );
    return data;
  },
};

export default recipeApi;
