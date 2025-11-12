package com.stg.sikboo.chat.presentation;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.stg.sikboo.chat.dto.request.ChatMessageCreateRequest;
import com.stg.sikboo.chat.dto.response.ChatMessageResponse;
import com.stg.sikboo.chat.service.ChatMessageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {
    
    private final ChatMessageService chatMessageService;
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * 채팅 메시지 전송 (WebSocket)
     * 클라이언트가 /app/chat.send로 메시지를 보내면
     * 처리 후 /topic/groupbuying/{groupBuyingId}로 브로드캐스트
     */
    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessageCreateRequest request) {
        log.info("WebSocket 메시지 수신 - groupBuyingId: {}, memberId: {}", 
                request.getGroupBuyingId(), request.getMemberId());
        
        // 메시지 저장 및 응답 생성
        ChatMessageResponse response = chatMessageService.sendMessage(request);
        
        log.info("WebSocket 메시지 브로드캐스트 - messageId: {}, destination: /topic/groupbuying/{}", 
                response.getMessageId(), request.getGroupBuyingId());
        
        // 동적으로 해당 채팅방 구독자들에게 브로드캐스트
        messagingTemplate.convertAndSend(
            "/topic/groupbuying/" + request.getGroupBuyingId(), 
            response
        );
    }
}
