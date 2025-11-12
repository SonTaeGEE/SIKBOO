import { useEffect, useRef, useCallback, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

/**
 * WebSocket 연결 및 메시지 송수신을 관리하는 Hook
 * @param {string} url - WebSocket 서버 URL
 * @returns {object} WebSocket 연결 상태 및 메서드
 */
export const useWebSocket = (url) => {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const subscriptionsRef = useRef(new Map());

  /**
   * WebSocket 연결
   */
  const connect = useCallback(() => {
    if (clientRef.current?.connected) {
      console.log('이미 연결되어 있습니다.');
      return;
    }

    try {
      // SockJS를 사용한 WebSocket 연결
      const socket = new SockJS(url);

      // STOMP 클라이언트 생성
      const stompClient = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000, // 재연결 시도 간격 (5초)
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        onConnect: () => {
          console.log('WebSocket 연결 성공');
          setIsConnected(true);
          setError(null);
        },
        onDisconnect: () => {
          console.log('WebSocket 연결 해제');
          setIsConnected(false);
        },
        onStompError: (frame) => {
          console.error('STOMP 에러:', frame.headers['message']);
          setError(frame.headers['message'] || 'WebSocket 에러 발생');
          setIsConnected(false);
        },
      });

      clientRef.current = stompClient;
      stompClient.activate();
    } catch (err) {
      console.error('WebSocket 연결 실패:', err);
      setError(err.message);
      setIsConnected(false);
    }
  }, [url]);

  /**
   * WebSocket 연결 해제
   */
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      // 모든 구독 해제
      subscriptionsRef.current.forEach((subscription) => {
        subscription.unsubscribe();
      });
      subscriptionsRef.current.clear();

      // 연결 해제
      clientRef.current.deactivate();
      clientRef.current = null;
      setIsConnected(false);
      console.log('WebSocket 연결 종료');
    }
  }, []);

  /**
   * 특정 destination 구독
   * @param {string} destination - 구독할 경로 (예: /topic/groupbuying/1)
   * @param {function} callback - 메시지 수신 시 호출될 콜백
   * @returns {function} 구독 해제 함수
   */
  const subscribe = useCallback((destination, callback) => {
    if (!clientRef.current?.connected) {
      console.error('WebSocket이 연결되지 않았습니다.');
      return () => {};
    }

    const subscription = clientRef.current.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (err) {
        console.error('메시지 파싱 실패:', err);
      }
    });

    // 구독 정보 저장
    subscriptionsRef.current.set(destination, subscription);

    // 구독 해제 함수 반환
    return () => {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(destination);
    };
  }, []);

  /**
   * 메시지 전송
   * @param {string} destination - 전송할 경로 (예: /app/chat.send)
   * @param {object} body - 전송할 메시지 객체
   */
  const sendMessage = useCallback((destination, body) => {
    if (!clientRef.current?.connected) {
      console.error('WebSocket이 연결되지 않았습니다.');
      return false;
    }

    try {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
      });
      return true;
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // 컴포넌트 언마운트 시 연결 해제
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    subscribe,
    sendMessage,
  };
};
