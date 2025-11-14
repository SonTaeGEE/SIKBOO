import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useWebSocket } from '@/hooks/useWebSocket';
import { useChatMessagesPaginated, chatKeys } from '@/hooks/useChat';

const WEBSOCKET_URL = `${import.meta.env.VITE_API_BASE_URL}/ws`;

/**
 * 채팅 전용 WebSocket Hook (Cursor-based Pagination)
 * @param {string|number} groupBuyingId - 공동구매 ID
 * @param {number} currentUserId - 현재 사용자 ID
 * @returns {object} 채팅 메시지 및 전송 함수
 */
export const useChatWebSocket = (groupBuyingId, currentUserId) => {
  const queryClient = useQueryClient();
  const {
    isConnected,
    error,
    connect,
    disconnect,
    subscribe,
    sendMessage: wsSendMessage,
  } = useWebSocket(WEBSOCKET_URL);

  // Cursor-based Pagination으로 메시지 로드
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useChatMessagesPaginated(groupBuyingId);

  const messages = data?.messages || [];

  // WebSocket 연결
  useEffect(() => {
    if (!groupBuyingId) return;

    console.log('WebSocket 연결 시작...', groupBuyingId);
    connect();

    return () => {
      console.log('WebSocket 연결 해제');
      disconnect();
    };
  }, [groupBuyingId, connect, disconnect]);

  // 연결 성공 후 채팅방 구독
  useEffect(() => {
    if (!isConnected || !groupBuyingId) return;

    const destination = `/topic/groupbuying/${groupBuyingId}`;
    console.log('채팅방 구독:', destination);

    const unsubscribe = subscribe(destination, (newMessage) => {
      console.log('새 메시지 수신:', newMessage);

      // React Query 무한 스크롤 캐시에 새 메시지 추가
      queryClient.setQueryData(chatKeys.messagesPaginated(groupBuyingId), (oldData) => {
        if (!oldData) return oldData;

        // 첫 번째 페이지(최신 페이지)에 새 메시지 추가
        const newPages = [...oldData.pages];
        newPages[0] = {
          ...newPages[0],
          messages: [...newPages[0].messages, newMessage],
        };

        return {
          ...oldData,
          pages: newPages,
        };
      });
    });

    return () => {
      console.log('채팅방 구독 해제:', destination);
      unsubscribe();
    };
  }, [groupBuyingId, isConnected, subscribe, queryClient]);

  /**
   * 메시지 전송
   * @param {string} messageText - 전송할 메시지 내용
   */
  const sendChatMessage = useCallback(
    (messageText) => {
      if (!messageText.trim()) {
        console.warn('빈 메시지는 전송할 수 없습니다.');
        return false;
      }

      if (!currentUserId) {
        console.error('사용자 ID가 없습니다.');
        return false;
      }

      const messageData = {
        groupBuyingId: Number(groupBuyingId),
        memberId: currentUserId,
        message: messageText.trim(),
      };

      console.log('메시지 전송 시도:', messageData);
      const success = wsSendMessage('/app/chat.send', messageData);

      if (success) {
        console.log('메시지 전송 성공');
      } else {
        console.error('메시지 전송 실패');
      }

      return success;
    },
    [groupBuyingId, currentUserId, wsSendMessage],
  );

  return {
    messages,
    sendMessage: sendChatMessage,
    isConnected,
    isLoading,
    error,
    // 무한 스크롤 관련
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
