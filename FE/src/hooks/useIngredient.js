import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ingredientApi from '@/api/ingredientApi';

// Query Keys
export const ingredientKeys = {
  all: ['ingredients'],
  lists: () => [...ingredientKeys.all, 'list'],
  list: (filters) => [...ingredientKeys.lists(), filters],
  mine: () => [...ingredientKeys.all, 'mine'],
  details: () => [...ingredientKeys.all, 'detail'],
  detail: (id) => [...ingredientKeys.details(), id],
};

/**
 * 재료 목록 조회
 */
export const useIngredients = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ingredientKeys.list(filters),
    queryFn: () => ingredientApi.listIngredients(filters),
    ...options,
  });
};

/**
 * AI 자연어 분석
 */
export const useAnalyzeIngredientText = () => {
  return useMutation({
    mutationFn: (text) => ingredientApi.analyzeIngredientText(text),
  });
};

/**
 * AI 분석 결과 저장
 */
export const useAddIngredientsFromAi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items) => ingredientApi.addIngredientsFromAi(items),
    onSuccess: () => {
      // AI로 추가한 재료들이 목록에 반영되도록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ingredientKeys.mine() });
    },
  });
};

/**
 * 재료 생성
 */
export const useCreateIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => ingredientApi.createIngredient(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ingredientKeys.mine() });
    },
  });
};

/**
 * 재료 수정
 */
export const useUpdateIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }) => ingredientApi.updateIngredient(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ingredientKeys.mine() });
      queryClient.invalidateQueries({ queryKey: ingredientKeys.detail(variables.id) });
    },
  });
};

/**
 * 재료 삭제
 */
export const useDeleteIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => ingredientApi.deleteIngredient(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ingredientKeys.mine() });
      queryClient.removeQueries({ queryKey: ingredientKeys.detail(id) });
    },
  });
};
