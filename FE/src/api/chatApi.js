import axiosInstance from '@/api/axiosInstance';

/**
 * 채팅 API
 */

// 채팅 메시지 전송
export const sendChatMessage = async (data) => {
  const response = await axiosInstance.post('/chat/messages', data);
  return response.data;
};

// 특정 공동구매의 채팅 메시지 목록 조회
export const getChatMessages = async (groupBuyingId) => {
  const response = await axiosInstance.get(`/chat/groupbuying/${groupBuyingId}/messages`);
  return response.data;
};

// 채팅 메시지 개수 조회
export const getChatMessageCount = async (groupBuyingId) => {
  const response = await axiosInstance.get(`/chat/groupbuying/${groupBuyingId}/count`);
  return response.data;
};
