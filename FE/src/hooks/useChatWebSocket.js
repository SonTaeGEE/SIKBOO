import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useWebSocket } from '@/hooks/useWebSocket';
import { useChatMessages } from '@/hooks/useChat';

const WEBSOCKET_URL = `${import.meta.env.VITE_API_BASE_URL}/ws`;

/**
 * 채팅 전용 WebSocket Hook
 * @param {string|number} groupBuyingId - 공동구매 ID
 * @param {number} currentUserId - 현재 사용자 ID
 * @returns {object} 채팅 메시지 및 전송 함수
 */
export const useChatWebSocket = (groupBuyingId, currentUserId) => {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([]);
  const {
    isConnected,
    error,
    connect,
    disconnect,
    subscribe,
    sendMessage: wsSendMessage,
  } = useWebSocket(WEBSOCKET_URL);

  // 초기 메시지 로드 (한 번만, 폴링 없음)
  const { data: initialMessages = [], isLoading } = useChatMessages(groupBuyingId, {
    staleTime: Infinity, // 캐시를 무한대로 유지 (WebSocket으로 실시간 업데이트)
    refetchInterval: false, // 폴링 비활성화
  });

  // 초기 메시지 설정
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

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

      // 로컬 상태에 메시지 추가
      setMessages((prev) => [...prev, newMessage]);

      // React Query 캐시도 업데이트
      queryClient.setQueryData(['chat', 'messages', String(groupBuyingId)], (old = []) => {
        return [...old, newMessage];
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
  };
};
