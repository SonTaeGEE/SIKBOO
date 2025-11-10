import axiosInstance from '@/api/axiosInstance';

/**
 * 재료 목록 조회
 * - 서버에서 기본 정렬(유통기한 → 이름순)을 적용하므로
 *   sort/order 파라미터는 전송하지 않음
 */
export async function listIngredients({ location = null, q = null, page = 0, size = 50, sort = 'due', order = 'asc' } = {}) {
  const params = { page, size, sort, order };
  if (location) params.location = location;
  if (q) params.q = q;

  const res = await axiosInstance.get('/ingredients', { params });
  return res.data; // PageResponseDTO 형태 기대
}

/**
 * 재료 삭제
 * - 단건 삭제 API 호출
 */
export async function deleteIngredient(id) {
  return axiosInstance.delete(`/ingredients/${id}`);
}

/**
 * 재료 생성
 */
export async function createIngredient(body) {
  // body: { ingredientName, location, due, memo, [quantity] }
  const res = await axiosInstance.post('/ingredients', body);
  return res.data;
}
