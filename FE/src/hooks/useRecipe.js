import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import recipeApi from '@/api/recipeApi';

// Query Keys
export const recipeKeys = {
  all: ['recipes'],
  myIngredients: ['ingredients', 'mine'],
  sessions: ['recipes', 'sessions'],
  sessionDetail: (id) => ['recipes', 'session', id],
};

/**
 * 내 재료 목록 조회
 */
export const useMyIngredients = (enabled = true) => {
  return useQuery({
    queryKey: recipeKeys.myIngredients,
    queryFn: recipeApi.fetchMyIngredients,
    enabled,
  });
};

/**
 * 레시피 세션 목록 조회
 */
export const useRecipeSessions = (enabled = true) => {
  return useQuery({
    queryKey: recipeKeys.sessions,
    queryFn: recipeApi.listSessions,
    enabled,
  });
};

/**
 * 레시피 세션 상세 조회
 */
export const useRecipeSessionDetail = (sessionId, options = {}) => {
  return useQuery({
    queryKey: recipeKeys.sessionDetail(sessionId),
    queryFn: () => recipeApi.getSessionDetail(sessionId),
    enabled: !!sessionId,
    ...options,
  });
};

/**
 * 레시피 생성 Mutation
 */
export const useGenerateRecipes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ingredientIds) => recipeApi.generateRecipes(ingredientIds),
    onSuccess: () => {
      // 세션 목록 새로고침
      queryClient.invalidateQueries({ queryKey: recipeKeys.sessions });
    },
  });
};

/**
 * 다른 레시피 추천받기 Mutation
 */
export const useRecommendMore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, filter }) => recipeApi.recommendMore(sessionId, filter),
    onSuccess: (data, variables) => {
      // 해당 세션 상세 새로고침
      queryClient.invalidateQueries({ queryKey: recipeKeys.sessionDetail(variables.sessionId) });
    },
  });
};

/**
 * 레시피 세션 제목 수정 Mutation
 */
export const useUpdateSessionTitle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }) => recipeApi.updateSessionTitle(id, title),
    onSuccess: (data, variables) => {
      // 세션 목록 새로고침
      queryClient.invalidateQueries({ queryKey: recipeKeys.sessions });
      // 해당 세션 상세도 새로고침
      queryClient.invalidateQueries({ queryKey: recipeKeys.sessionDetail(variables.id) });
    },
  });
};

/**
 * 레시피 세션 삭제 Mutation
 */
export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId) => recipeApi.deleteSession(sessionId),
    onSuccess: (data, variables) => {
      // 세션 목록 새로고침
      queryClient.invalidateQueries({ queryKey: recipeKeys.sessions });
      // 삭제된 세션 상세 쿼리 제거
      queryClient.removeQueries({ queryKey: recipeKeys.sessionDetail(variables) });
    },
  });
};

/**
 * 레시피 세션 순서 재정렬 Mutation
 */
export const useReorderSessions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds) => recipeApi.reorderSessions(orderedIds),
    onSuccess: () => {
      // 세션 목록 새로고침
      queryClient.invalidateQueries({ queryKey: recipeKeys.sessions });
    },
  });
};
