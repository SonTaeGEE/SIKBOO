package com.stg.sikboo.groupbuying.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.stg.sikboo.groupbuying.domain.GroupBuying;
import com.stg.sikboo.groupbuying.domain.GroupBuying.Category;
import com.stg.sikboo.groupbuying.domain.GroupBuying.Status;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupBuyingResponse {
    
    private Long groupBuyingId;
    private Long memberId;
    private String memberName;
    private String title;
    private Category category;
    private Integer totalPrice;
    private Integer maxPeople;
    private String info;
    private Integer currentPeople;
    private String pickupLocation;
    private BigDecimal pickupLatitude;
    private BigDecimal pickupLongitude;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss[.SSS][XXX][X]", timezone = "Asia/Seoul")
    private LocalDateTime deadline;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss[.SSS][XXX][X]", timezone = "Asia/Seoul")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss[.SSS][XXX][X]", timezone = "Asia/Seoul")
    private LocalDateTime updatedAt;
    
    private Status status;
    
    // 거리 (km) - 사용자 위치 기반 계산 시 사용
    private Double distance;

    public static GroupBuyingResponse from(GroupBuying groupBuying) {
        return from(groupBuying, null);
    }
    
    public static GroupBuyingResponse from(GroupBuying groupBuying, Double distance) {
        return GroupBuyingResponse.builder()
                .groupBuyingId(groupBuying.getGroupBuyingId())
                .memberId(groupBuying.getMember().getId())
                .memberName(groupBuying.getMember().getName())
                .title(groupBuying.getTitle())
                .category(groupBuying.getCategory())
                .totalPrice(groupBuying.getTotalPrice())
                .maxPeople(groupBuying.getMaxPeople())
                .info(groupBuying.getInfo())
                .currentPeople(groupBuying.getCurrentPeople())
                .pickupLocation(groupBuying.getPickupLocation())
                .pickupLatitude(groupBuying.getPickupLatitude())
                .pickupLongitude(groupBuying.getPickupLongitude())
                .deadline(groupBuying.getDeadline())
                .createdAt(groupBuying.getCreatedAt())
                .updatedAt(groupBuying.getUpdatedAt())
                .status(groupBuying.getStatus())
                .distance(distance) // 거리 계산 시 별도로 설정
                .build();
    }
}
