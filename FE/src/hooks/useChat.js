import { useQuery } from '@tanstack/react-query';
import { getChatMessages } from '@/api/chatApi';

// Query Keys
export const chatKeys = {
  all: ['chat'],
  messages: (groupBuyingId) => [...chatKeys.all, 'messages', groupBuyingId],
  count: (groupBuyingId) => [...chatKeys.all, 'count', groupBuyingId],
};

/**
 * 채팅 메시지 목록 조회
 */
export const useChatMessages = (groupBuyingId) => {
  return useQuery({
    queryKey: chatKeys.messages(groupBuyingId),
    queryFn: () => getChatMessages(groupBuyingId),
    enabled: !!groupBuyingId,
  });
};
