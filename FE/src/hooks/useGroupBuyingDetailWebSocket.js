import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

import { useWebSocket } from '@/hooks/useWebSocket';
import { groupBuyingKeys } from '@/hooks/useGroupBuying';
import { useCurrentUser } from '@/hooks/useUser';

const WEBSOCKET_URL = `${import.meta.env.VITE_API_BASE_URL}/ws`;

/**
 * 특정 공동구매 참여자 실시간 업데이트를 위한 WebSocket Hook
 * @param {string|number} groupBuyingId - 공동구매 ID
 * @returns {object} WebSocket 연결 상태
 */
export const useGroupBuyingDetailWebSocket = (groupBuyingId) => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const { isConnected, error, connect, disconnect, subscribe } = useWebSocket(WEBSOCKET_URL);

  // WebSocket 연결
  useEffect(() => {
    if (!groupBuyingId) return;

    console.log('공동구매 상세 WebSocket 연결 시작...', groupBuyingId);
    connect();

    return () => {
      console.log('공동구매 상세 WebSocket 연결 해제');
      disconnect();
    };
  }, [groupBuyingId, connect, disconnect]);

  // 연결 성공 후 특정 공동구매 참여자 업데이트 구독
  useEffect(() => {
    if (!isConnected || !groupBuyingId) return;

    const destination = `/topic/groupbuying/${groupBuyingId}/participants`;
    console.log('공동구매 참여자 업데이트 구독:', destination);

    const unsubscribe = subscribe(destination, (update) => {
      console.log('참여자 업데이트 수신:', update);

      // 당사자가 아닐 때만 toast 표시
      const isCurrentUser = currentUser?.id === update.memberId;
      if (!isCurrentUser) {
        if (update.updateType === 'PARTICIPANT_JOINED') toast.success('참여자가 들어왔습니다!');
        if (update.updateType === 'PARTICIPANT_LEFT') toast.error('참여자가 나갔습니다...');
      }

      // 공동구매 상세 정보 refetch (currentPeople, status 업데이트)
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.detail(groupBuyingId) });

      // 참여자 목록은 refetch로 최신 데이터 가져오기
      queryClient.invalidateQueries({ queryKey: groupBuyingKeys.participants(groupBuyingId) });
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, groupBuyingId, subscribe, queryClient, currentUser?.id]);

  return {
    isConnected,
    error,
  };
};
