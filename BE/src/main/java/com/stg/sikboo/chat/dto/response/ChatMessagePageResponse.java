package com.stg.sikboo.chat.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessagePageResponse {
    
    /**
     * 채팅 메시지 목록
     */
    private List<ChatMessageResponse> messages;
    
    /**
     * 다음 페이지를 위한 커서 (마지막 메시지 ID)
     * null이면 더 이상 메시지가 없음
     */
    private Long nextCursor;
    
    /**
     * 다음 페이지 존재 여부
     */
    private boolean hasMore;
    
    /**
     * 현재 페이지의 메시지 개수
     */
    private int size;
}
