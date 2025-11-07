import api from "@/api/apiDev"; // ✅ 개발 중에는 apiDev 사용 (memberId=1 자동 주입)

const recipeApi = {
  fetchMyIngredients: async () => {
    const { data } = await api.get("/ingredients/my");
    return Array.isArray(data) ? data : [];
  },
  fetchRecipeList: async ({ filter, q }) => {
    const { data } = await api.get("/recipes", { params: { filter, q } });
    return Array.isArray(data) ? data : [];
  },
  generateRecipes: async (ids) => {
    const { data } = await api.post("/recipes/generate", { ingredientIds: ids });
    return data;
  },
  recommendMore: async () => {
    const { data } = await api.post("/recipes/recommend-more");
    return data;
  },
};

export default recipeApi;
