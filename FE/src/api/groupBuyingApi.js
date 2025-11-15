import axiosInstance from '@/api/axiosInstance';

/**
 * 공동구매 API
 */

// 공동구매 생성
export const createGroupBuying = async (data) => {
  const response = await axiosInstance.post('/groupbuyings', data);
  return response.data;
};

// 공동구매 단건 조회
export const getGroupBuying = async (id) => {
  const response = await axiosInstance.get(`/groupbuyings/${id}`);
  return response.data;
};

// 카테고리별 공동구매 목록 조회
export const getGroupBuyingsByCategory = async (category) => {
  const response = await axiosInstance.get(`/groupbuyings/category/${category}`);
  return response.data;
};

// 공동구매 수정
export const updateGroupBuying = async ({ id, data }) => {
  const response = await axiosInstance.put(`/groupbuyings/${id}`, data);
  return response.data;
};

// 공동구매 삭제
export const deleteGroupBuying = async (id) => {
  await axiosInstance.delete(`/groupbuyings/${id}`);
};

// 공동구매 참여 (Participant API 사용)
export const joinGroupBuying = async ({ id, memberId }) => {
  const response = await axiosInstance.post('/participants', {
    groupBuyingId: id,
    memberId: memberId,
  });
  return response.data;
};

// 공동구매 나가기 (Participant API 사용)
export const leaveGroupBuying = async ({ id, memberId }) => {
  await axiosInstance.delete(`/participants?groupBuyingId=${id}&memberId=${memberId}`);
};

// 내가 참여한 공동구매 목록 조회 (필터링 및 페이징)
export const searchMyParticipatingGroupBuyings = async (params) => {
  const queryParams = new URLSearchParams();

  if (params.memberId !== undefined) queryParams.append('memberId', params.memberId);
  if (params.search) queryParams.append('search', params.search);
  if (params.category) queryParams.append('category', params.category);
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.size !== undefined) queryParams.append('size', params.size);

  const response = await axiosInstance.get(`/participants/my/search?${queryParams.toString()}`);
  return response.data;
};

// 참여 여부 확인
export const checkParticipation = async (groupBuyingId, memberId) => {
  const response = await axiosInstance.get(
    `/participants/check?groupBuyingId=${groupBuyingId}&memberId=${memberId}`,
  );
  return response.data;
};

/**
 * 통합 필터링 및 페이징 조회 (무한 스크롤용)
 * @param {Object} params - 필터 파라미터
 * @param {string} params.search - 검색어
 * @param {string} params.category - 카테고리 (FRUIT, VEGETABLE, MEAT, SEAFOOD, DAIRY, ETC)
 * @param {string} params.status - 상태 (RECRUITING, DEADLINE)
 * @param {number} params.lat - 사용자 위도
 * @param {number} params.lng - 사용자 경도
 * @param {number} params.distance - 최대 거리 (km)
 * @param {number} params.page - 페이지 번호 (0부터 시작)
 * @param {number} params.size - 페이지 크기
 * @returns {Promise} 페이지네이션된 공동구매 목록
 */
export const searchGroupBuyings = async (params) => {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.append('search', params.search);
  if (params.category) queryParams.append('category', params.category);
  if (params.status) queryParams.append('status', params.status);
  if (params.lat !== undefined) queryParams.append('lat', params.lat);
  if (params.lng !== undefined) queryParams.append('lng', params.lng);
  if (params.distance !== undefined) queryParams.append('distance', params.distance);
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.size !== undefined) queryParams.append('size', params.size);

  const response = await axiosInstance.get(`/groupbuyings/search?${queryParams.toString()}`);
  return response.data;
};

// 특정 공동구매의 참여자 목록 조회
export const getParticipantsByGroupBuying = async (groupBuyingId) => {
  const response = await axiosInstance.get(`/participants/groupbuying/${groupBuyingId}`);
  return response.data;
};
