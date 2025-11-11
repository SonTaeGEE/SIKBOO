import axiosInstance from '@/api/axiosInstance';

const recipeApi = {
  /** 생성 탭: 내 재료 */
  fetchMyIngredients: async () => {
    const { data } = await axiosInstance.get('/ingredients/my');
    return Array.isArray(data) ? data : [];
  },

  /**
   * 레시피 생성(= 방 생성)
   * 서버는 { id, title, createdAt }를 반환해야 합니다.
   * 이후 목록 탭으로 전환 & 해당 방 상세로 이동에 사용.
   */
  generateRecipes: async (ingredientIds) => {
    const { data } = await axiosInstance.post('/recipes/generate', {
      ingredientIds,
    });
    // 기대 형태: { id: number, title: string, createdAt: string }
    return data;
  },

  /** 방 목록 */
  listSessions: async () => {
    const { data } = await axiosInstance.get('/recipes/sessions');
    // 기대 형태: [{ id, title, createdAt }]
    return Array.isArray(data) ? data : [];
  },

  /** 방 상세 */
  getSessionDetail: async (sessionId) => {
    const { data } = await axiosInstance.get(`/recipes/sessions/${sessionId}`);
    // 기대 형태: { id, title, have:[], need:[] }
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
      { params },
    );
    return data;
  },
};

export default recipeApi;
