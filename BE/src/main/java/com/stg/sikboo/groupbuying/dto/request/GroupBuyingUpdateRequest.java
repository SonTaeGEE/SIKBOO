package com.stg.sikboo.groupbuying.dto.request;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.stg.sikboo.groupbuying.domain.GroupBuying.Category;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupBuyingUpdateRequest {
    
    private String title;
    
    private Category category;
    
    @Positive(message = "총 가격은 양수여야 합니다")
    private Integer totalPrice;
    
    @Positive(message = "최대 인원은 양수여야 합니다")
    private Integer maxPeople;
    
    private String info;
    
    private String pickupLocation;
    
    private BigDecimal pickupLatitude;
    
    private BigDecimal pickupLongitude;
    
    private LocalDateTime deadline;
}
