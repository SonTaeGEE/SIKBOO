package com.stg.sikboo.participant.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantJoinRequest {
    
    @NotNull(message = "공동구매 ID는 필수입니다")
    private Long groupBuyingId;
    
    @NotNull(message = "회원 ID는 필수입니다")
    private Long memberId;
}
