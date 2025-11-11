package com.stg.sikboo.groupbuying.dto.request;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.stg.sikboo.groupbuying.domain.GroupBuying.Category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupBuyingCreateRequest {
    
    @NotNull(message = "회원 ID는 필수입니다")
    private Long memberId;
    
    @NotBlank(message = "제목은 필수입니다")
    private String title;
    
    @NotNull(message = "카테고리는 필수입니다")
    private Category category;
    
    @NotNull(message = "총 가격은 필수입니다")
    @Positive(message = "총 가격은 양수여야 합니다")
    private Integer totalPrice;
    
    @NotNull(message = "최대 인원은 필수입니다")
    @Positive(message = "최대 인원은 양수여야 합니다")
    private Integer maxPeople;
    
    @NotBlank(message = "픽업 장소는 필수입니다")
    private String pickupLocation;
    
    @NotNull(message = "픽업 위도는 필수입니다")
    private BigDecimal pickupLatitude;
    
    @NotNull(message = "픽업 경도는 필수입니다")
    private BigDecimal pickupLongitude;
    
    @NotNull(message = "마감 시간은 필수입니다")
    private LocalDateTime deadline;
    
    private String info;
}
