// src/api/recipeApi.js
import axiosInstance from '@/api/axiosInstance';

// 공통 타임아웃: AI 응답이 길어도 'canceled' 되지 않도록 충분히 여유
const LONG_TIMEOUT = 70_000;

const recipeApi = {
  /** 생성 탭: 내 재료 */
  fetchMyIngredients: async () => {
    const { data } = await axiosInstance.get('/ingredients/my', {
      withCredentials: true,
    });
    return Array.isArray(data) ? data : [];
  },

  /** 레시피 생성(= 방 생성): { id, title } */
  generateRecipes: async (ingredientIds) => {
    const { data } = await axiosInstance.post(
      '/recipes/generate',
      { ingredientIds },
      {
        timeout: LONG_TIMEOUT,
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
      timeout: LONG_TIMEOUT,
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
