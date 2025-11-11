package com.stg.sikboo.participant.dto.response;

import java.time.LocalDateTime;

import com.stg.sikboo.groupbuying.domain.GroupBuying;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyGroupBuyingResponse {
    
    private Long groupBuyingId;
    private String title;
    private String category;
    private Integer totalPrice;
    private Integer currentPeople;
    private Integer maxPeople;
    private String pickupLocation;
    private LocalDateTime deadline;
    private String status;
    private LocalDateTime joinedAt;
    
    public static MyGroupBuyingResponse from(GroupBuying groupBuying, LocalDateTime joinedAt) {
        return MyGroupBuyingResponse.builder()
                .groupBuyingId(groupBuying.getGroupBuyingId())
                .title(groupBuying.getTitle())
                .category(groupBuying.getCategory().name())
                .totalPrice(groupBuying.getTotalPrice())
                .currentPeople(groupBuying.getCurrentPeople())
                .maxPeople(groupBuying.getMaxPeople())
                .pickupLocation(groupBuying.getPickupLocation())
                .deadline(groupBuying.getDeadline())
                .status(groupBuying.getStatus().name())
                .joinedAt(joinedAt)
                .build();
    }
}
