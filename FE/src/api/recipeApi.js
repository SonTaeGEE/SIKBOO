import axiosInstance from '@/api/axiosInstance';

const recipeApi = {
  fetchMyIngredients: async () => {
    const { data } = await axiosInstance.get('/ingredients/my');
    return Array.isArray(data) ? data : [];
  },
  fetchRecipeList: async ({ filter, q }) => {
    const { data } = await axiosInstance.get('/recipes', { params: { filter, q } });
    return Array.isArray(data) ? data : [];
  },
  generateRecipes: async (ids) => {
    const { data } = await axiosInstance.post('/recipes/generate', { ingredientIds: ids });
    return data;
  },
  recommendMore: async () => {
    const { data } = await axiosInstance.post('/recipes/recommend-more');
    return data;
  },
};

export default recipeApi;
