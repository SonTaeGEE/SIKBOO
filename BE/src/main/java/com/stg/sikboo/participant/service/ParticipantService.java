package com.stg.sikboo.participant.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stg.sikboo.groupbuying.domain.GroupBuying;
import com.stg.sikboo.groupbuying.domain.repository.GroupBuyingRepository;
import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.member.domain.MemberRepository;
import com.stg.sikboo.participant.dto.response.MyGroupBuyingResponse;
import com.stg.sikboo.participant.dto.request.ParticipantJoinRequest;
import com.stg.sikboo.participant.dto.response.ParticipantResponse;
import com.stg.sikboo.participant.domain.Participant;
import com.stg.sikboo.participant.domain.repository.ParticipantRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ParticipantService {
    
    private final ParticipantRepository participantRepository;
    private final GroupBuyingRepository groupBuyingRepository;
    private final MemberRepository memberRepository;
    
    /**
     * 공동구매 참여
     */
    @Transactional
    public ParticipantResponse joinGroupBuying(ParticipantJoinRequest request) {              
        // 1. 공동구매 조회
        GroupBuying groupBuying = groupBuyingRepository.findById(request.getGroupBuyingId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        
        // 2. 회원 조회
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        
        // 3. 이미 참여했는지 확인
        if (participantRepository.existsByGroupBuying_GroupBuyingIdAndMember_Id(
                request.getGroupBuyingId(), request.getMemberId())) {
            throw new IllegalStateException("이미 참여한 공동구매입니다.");
        }
        
        // 4. 마감 여부 확인
        if (groupBuying.getStatus() == GroupBuying.Status.마감) {
            throw new IllegalStateException("마감된 공동구매입니다.");
        }
        
        // 5. 참여 생성
        Participant participant = Participant.builder()
                .groupBuying(groupBuying)
                .member(member)
                .build();
        
        Participant saved = participantRepository.save(participant);
        
        // 6. participants 리스트에 추가하여 자동 동기화 트리거
        groupBuying.getParticipants().add(saved);
        groupBuyingRepository.flush();
        
        return ParticipantResponse.from(saved);
    }
    
    /**
     * 공동구매 나가기
     */
    @Transactional
    public void leaveGroupBuying(Long groupBuyingId, Long memberId) {
        // 1. 참여 정보 조회
        Participant participant = participantRepository.findByGroupBuying_GroupBuyingIdAndMember_Id(groupBuyingId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("참여하지 않은 공동구매입니다."));
        
        // 2. 공동구매 조회
        GroupBuying groupBuying = participant.getGroupBuying();
        
        // 3. 주최자는 나갈 수 없음
        if (groupBuying.getMember().getId().equals(memberId)) {
            throw new IllegalStateException("주최자는 공동구매에서 나갈 수 없습니다.");
        }
        
        // 4. participants 리스트에서 제거하여 자동 동기화 트리거
        groupBuying.getParticipants().remove(participant);
        
        // 5. 참여 삭제
        participantRepository.delete(participant);
        groupBuyingRepository.flush();
    }
    
    /**
     * 특정 공동구매의 참여자 목록 조회
     */
    public List<ParticipantResponse> getParticipantsByGroupBuying(Long groupBuyingId) {
        return participantRepository.findByGroupBuying_GroupBuyingId(groupBuyingId).stream()
                .map(ParticipantResponse::from)
                .collect(Collectors.toList());
    }
    
    /**
     * 내가 참여한 공동구매 목록 조회
     */
    public List<MyGroupBuyingResponse> getMyParticipatingGroupBuyings(Long memberId) {
        return participantRepository.findByMember_Id(memberId).stream()
                .sorted((a, b) -> b.getJoinedAt().compareTo(a.getJoinedAt()))
                .map(p -> MyGroupBuyingResponse.from(p.getGroupBuying(), p.getJoinedAt()))
                .collect(Collectors.toList());
    }
    
    /**
     * 참여 여부 확인
     */
    public boolean isParticipating(Long groupBuyingId, Long memberId) {
        return participantRepository.existsByGroupBuying_GroupBuyingIdAndMember_Id(groupBuyingId, memberId);
    }
    
    /**
     * 참여자 수 조회
     */
    public long countParticipants(Long groupBuyingId) {
        return participantRepository.countByGroupBuying_GroupBuyingId(groupBuyingId);
    }
}
