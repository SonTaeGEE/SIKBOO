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

// 전체 공동구매 목록 조회
export const getAllGroupBuyings = async () => {
  const response = await axiosInstance.get('/groupbuyings');
  return response.data;
};

// 모집중인 공동구매 목록 조회
export const getActiveGroupBuyings = async () => {
  const response = await axiosInstance.get('/groupbuyings/active');
  return response.data;
};

// 카테고리별 공동구매 목록 조회
export const getGroupBuyingsByCategory = async (category) => {
  const response = await axiosInstance.get(`/groupbuyings/category/${category}`);
  return response.data;
};

// 내가 만든 공동구매 목록 조회
export const getMyGroupBuyings = async (memberId) => {
  const response = await axiosInstance.get(`/groupbuyings/my?memberId=${memberId}`);
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

// 내가 참여한 공동구매 목록 조회
export const getMyParticipatingGroupBuyings = async (memberId) => {
  const response = await axiosInstance.get(`/participants/my?memberId=${memberId}`);
  return response.data;
};

// 참여 여부 확인
export const checkParticipation = async (groupBuyingId, memberId) => {
  const response = await axiosInstance.get(
    `/participants/check?groupBuyingId=${groupBuyingId}&memberId=${memberId}`,
  );
  return response.data;
};

// 특정 공동구매의 참여자 목록 조회
export const getParticipantsByGroupBuying = async (groupBuyingId) => {
  const response = await axiosInstance.get(`/participants/groupbuying/${groupBuyingId}`);
  return response.data;
};
