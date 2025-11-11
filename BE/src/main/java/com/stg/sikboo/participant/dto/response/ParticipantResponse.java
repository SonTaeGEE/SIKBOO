package com.stg.sikboo.participant.dto.response;

import java.time.LocalDateTime;

import com.stg.sikboo.participant.domain.Participant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipantResponse {
    
    private Long participantId;
    private Long groupBuyingId;
    private String groupBuyingTitle;
    private Long memberId;
    private String memberName;
    private LocalDateTime joinedAt;
    
    public static ParticipantResponse from(Participant participant) {
        return ParticipantResponse.builder()
                .participantId(participant.getParticipantId())
                .groupBuyingId(participant.getGroupBuying().getGroupBuyingId())
                .groupBuyingTitle(participant.getGroupBuying().getTitle())
                .memberId(participant.getMember().getId())
                .memberName(participant.getMember().getName())
                .joinedAt(participant.getJoinedAt())
                .build();
    }
}
