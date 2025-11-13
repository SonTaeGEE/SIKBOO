package com.stg.sikboo.chat.dto.response;

import java.time.LocalDateTime;

import com.stg.sikboo.chat.domain.ChatMessage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    
    private Long messageId;
    private Long groupBuyingId;
    private Long memberId;
    private String memberName;
    private String message;
    private LocalDateTime createdAt;
    
    public static ChatMessageResponse from(ChatMessage chatMessage) {
        return ChatMessageResponse.builder()
                .messageId(chatMessage.getMessageId())
                .groupBuyingId(chatMessage.getGroupBuying().getGroupBuyingId())
                .memberId(chatMessage.getMemberId())
                .memberName(chatMessage.getMemberName())  // 비정규화된 이름
                .message(chatMessage.getMessage())
                .createdAt(chatMessage.getCreatedAt())
                .build();
    }
}
