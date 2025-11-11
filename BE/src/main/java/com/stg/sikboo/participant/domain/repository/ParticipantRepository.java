package com.stg.sikboo.participant.domain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.stg.sikboo.groupbuying.domain.GroupBuying;
import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.participant.domain.Participant;

/**
 * Participant 리포지토리
 * DDD 아키텍처에서 도메인 계층에 위치
 */
public interface ParticipantRepository extends JpaRepository<Participant, Long> {
    
    List<Participant> findByGroupBuying_GroupBuyingId(Long groupBuyingId);
    
    List<Participant> findByMember_Id(Long memberId);
    
    Optional<Participant> findByGroupBuying_GroupBuyingIdAndMember_Id(Long groupBuyingId, Long memberId);
    
    boolean existsByGroupBuying_GroupBuyingIdAndMember_Id(Long groupBuyingId, Long memberId);
    
    long countByGroupBuying_GroupBuyingId(Long groupBuyingId);
    
    void deleteByGroupBuying_GroupBuyingIdAndMember_Id(Long groupBuyingId, Long memberId);
    
    // Entity를 직접 받는 메서드
    boolean existsByGroupBuyingAndMember(GroupBuying groupBuying, Member member);
    
    Optional<Participant> findByGroupBuyingAndMember(GroupBuying groupBuying, Member member);
}
