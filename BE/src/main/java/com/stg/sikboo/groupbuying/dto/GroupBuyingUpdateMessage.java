package com.stg.sikboo.groupbuying.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * WebSocket을 통해 공동구매 업데이트를 전송하기 위한 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupBuyingUpdateMessage {
    
    private Long groupBuyingId;
    private String updateType; // "CREATED", "PARTICIPANT_JOINED", "PARTICIPANT_LEFT", "DELETED"
    private Integer currentPeople;
    private String status; // "RECRUITING", "DEADLINE"
    private Long memberId; // 참가/나가기 당사자 ID
    
}
