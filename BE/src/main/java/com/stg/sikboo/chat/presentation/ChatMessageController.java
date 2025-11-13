package com.stg.sikboo.chat.presentation;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stg.sikboo.chat.dto.request.ChatMessageCreateRequest;
import com.stg.sikboo.chat.dto.response.ChatMessageResponse;
import com.stg.sikboo.chat.service.ChatMessageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatMessageController {
    
    private final ChatMessageService chatMessageService;
    
    /**
     * 채팅 메시지 전송
     */
    @PostMapping("/messages")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @Valid @RequestBody ChatMessageCreateRequest request) {
        ChatMessageResponse response = chatMessageService.sendMessage(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 특정 공동구매의 채팅 메시지 목록 조회
     */
    @GetMapping("/groupbuying/{groupBuyingId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessagesByGroupBuying(
            @PathVariable("groupBuyingId") Long groupBuyingId) {
        List<ChatMessageResponse> responses = chatMessageService.getMessagesByGroupBuying(groupBuyingId);
        return ResponseEntity.ok(responses);
    }
    
    /**
     * 특정 공동구매의 채팅 메시지 개수 조회
     */
    @GetMapping("/groupbuying/{groupBuyingId}/count")
    public ResponseEntity<Long> countMessagesByGroupBuying(
            @PathVariable("groupBuyingId") Long groupBuyingId) {
        long count = chatMessageService.countMessagesByGroupBuying(groupBuyingId);
        return ResponseEntity.ok(count);
    }
}
