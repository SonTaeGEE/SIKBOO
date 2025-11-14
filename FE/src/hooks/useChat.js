import { useInfiniteQuery } from '@tanstack/react-query';
import { getChatMessagesPaginated } from '@/api/chatApi';

// Query Keys
export const chatKeys = {
  all: ['chat'],
  messages: (groupBuyingId) => [...chatKeys.all, 'messages', groupBuyingId],
  messagesPaginated: (groupBuyingId) => [...chatKeys.all, 'messages', 'paginated', groupBuyingId],
  count: (groupBuyingId) => [...chatKeys.all, 'count', groupBuyingId],
};

/**
 * 채팅 메시지 무한 스크롤 조회 (Cursor-based Pagination)
 */
export const useChatMessagesPaginated = (groupBuyingId, pageSize = 50) => {
  return useInfiniteQuery({
    queryKey: chatKeys.messagesPaginated(groupBuyingId),
    queryFn: ({ pageParam }) => getChatMessagesPaginated(groupBuyingId, pageParam, pageSize),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: null, // 초기엔 cursor 없음 (최신 메시지부터)
    enabled: !!groupBuyingId,
    select: (data) => ({
      pages: data.pages,
      // 페이지를 역순으로 평탄화 (오래된 메시지가 위에, 최신 메시지가 아래)
      messages: [...data.pages].reverse().flatMap((page) => page.messages),
    }),
  });
};
