import axiosInstance from '@/api/axiosInstance';

const recipeApi = {
  // [생성 탭] 내 재료
  fetchMyIngredients: async () => {
    const { data } = await axiosInstance.get('/ingredients/my');
    return Array.isArray(data) ? data : [];
  },

  // [목록 탭] 레시피 조회
  fetchRecipeList: async ({ filter, q }) => {
    const { data } = await axiosInstance.get('/recipes', { params: { filter, q } });
    return Array.isArray(data) ? data : [];
  },

  // [생성 버튼] 레시피 생성
  generateRecipes: async (ids) => {
    const { data } = await axiosInstance.post('/recipes/generate', { ingredientIds: ids });
    return data;
  },

  // [다른 레시피 추천받기!]
  recommendMore: async () => {
    const { data } = await axiosInstance.post('/recipes/recommend-more');
    return data;
  },
};

export default recipeApi;
