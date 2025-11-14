package com.stg.sikboo.chat.domain.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.stg.sikboo.chat.domain.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    /**
     * 특정 공동구매의 채팅 메시지 개수
     */
    long countByGroupBuying_GroupBuyingId(Long groupBuyingId);
    
    /**
     * Cursor-based Pagination: 최신 메시지부터 N개 조회 (초기 로드용)
     */
    @Query("SELECT cm " +
            "FROM ChatMessage cm " +
            "WHERE cm.groupBuying.groupBuyingId = :groupBuyingId " +
            "ORDER BY cm.messageId DESC")
    List<ChatMessage> findRecentMessages(@Param("groupBuyingId") Long groupBuyingId, Pageable pageable);
    
    /**
     * Cursor-based Pagination: 특정 커서 이전 메시지 조회 (스크롤 업용)
     */
    @Query("SELECT cm " +
            "FROM ChatMessage cm " +
            "WHERE cm.groupBuying.groupBuyingId = :groupBuyingId " +
            "AND cm.messageId < :cursor " +
            "ORDER BY cm.messageId DESC")
    List<ChatMessage> findMessagesBefore(@Param("groupBuyingId") Long groupBuyingId, @Param("cursor") Long cursor, Pageable pageable);
}
