import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, MessageSquare, Wifi, WifiOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useGroupBuying } from '@/hooks/useGroupBuying';
import { useCurrentUser } from '@/hooks/useUser';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import Loading from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import ChatMessage from '@/components/GroupBuying/ChatMessage';

const GroupBuyingChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chatMessage, setChatMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // 현재 사용자 정보
  const { data: currentUser } = useCurrentUser();

  // 공동구매 정보
  const { data: groupBuying, isLoading: isLoadingGroupBuying } = useGroupBuying(id);

  // WebSocket 채팅 (실시간 + 무한 스크롤)
  const {
    messages,
    sendMessage: sendWebSocketMessage,
    isConnected,
    isLoading: isLoadingMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatWebSocket(id, currentUser?.id);

  // 스크롤을 맨 아래로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 초기 로드 시 맨 아래로 스크롤
  useEffect(() => {
    if (!isLoadingMessages && messages.length > 0) {
      // 초기 로드 완료 후 맨 아래로 이동 (smooth 없이 즉시)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingMessages]);

  // 새 메시지가 추가되면 스크롤 (본인이 보낸 메시지거나 맨 아래에 있을 때만)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;

    const isScrolledToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isScrolledToBottom) {
      scrollToBottom();
    }
  }, [messages]);

  // 스크롤 업 감지 (이전 메시지 로드)
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // 스크롤이 최상단에 도달하고, 더 불러올 메시지가 있을 때
    if (container.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      const prevHeight = container.scrollHeight;
      const prevScrollTop = container.scrollTop;

      fetchNextPage().then(() => {
        // 스크롤 위치 유지 (새 메시지 로드 후에도 같은 위치)
        requestAnimationFrame(() => {
          const newHeight = container.scrollHeight;
          container.scrollTop = prevScrollTop + (newHeight - prevHeight);
        });
      });
    }
  };

  // 메시지 전송 (WebSocket)
  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    if (!currentUser) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (!isConnected) {
      toast.error('채팅 서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const success = sendWebSocketMessage(chatMessage);
    if (success) {
      setChatMessage(''); // 입력창 초기화
    } else {
      toast.error('메시지 전송에 실패했습니다.');
    }
  };

  // 엔터키로 전송
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 로딩 중
  if (isLoadingGroupBuying || isLoadingMessages) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl bg-[#F9F5FF] p-4">
        <Loading message="채팅방을 불러오는 중..." />
      </div>
    );
  }

  // 공동구매를 찾을 수 없음
  if (!groupBuying) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl bg-[#F9F5FF] p-4">
        <EmptyState
          icon={MessageSquare}
          title="채팅방을 찾을 수 없습니다"
          message="공동구매가 종료되었거나 삭제되었습니다."
          showBackButton={true}
          homeButtonText="공동구매 목록"
          onBack={() => navigate('/group-buying')}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col bg-[#F9F5FF]">
      {/* 연결 상태 표시 */}
      <div
        className={`shrink-0 px-4 py-2 text-center text-xs font-medium ${
          isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}
      >
        <div className="flex items-center justify-center gap-1">
          {isConnected ? (
            <>
              <Wifi size={14} />
              <span>실시간 채팅 연결됨</span>
            </>
          ) : (
            <>
              <WifiOff size={14} />
              <span>연결 중...</span>
            </>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {/* 이전 메시지 로딩 표시 */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 className="animate-spin text-[#5f0080]" size={20} />
            <span className="ml-2 text-sm text-gray-500">이전 메시지 로딩 중...</span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <p>첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.messageId}
              message={msg}
              currentUserId={currentUser?.id}
              hostId={groupBuying.memberId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input - Fixed at bottom */}
      <div className="shrink-0 border-t border-gray-200 bg-white p-4">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={!isConnected}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={!chatMessage.trim() || !isConnected}
            className="rounded-lg bg-[#5f0080] px-5 py-3 text-white transition hover:bg-[#4a0066] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupBuyingChat;
