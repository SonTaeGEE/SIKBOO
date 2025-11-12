package com.stg.sikboo.chat.domain.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.stg.sikboo.chat.domain.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    /**
     * 특정 공동구매의 채팅 메시지 목록 조회 (시간순)
     */
    List<ChatMessage> findByGroupBuying_GroupBuyingIdOrderByCreatedAt(Long groupBuyingId);
    
    /**
     * 특정 공동구매의 채팅 메시지 개수
     */
    long countByGroupBuying_GroupBuyingId(Long groupBuyingId);
}
