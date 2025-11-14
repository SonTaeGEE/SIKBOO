package com.stg.sikboo.participant.domain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.stg.sikboo.groupbuying.domain.GroupBuying;
import com.stg.sikboo.groupbuying.domain.GroupBuying.Category;
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
    
    /**
     * 특정 회원이 참여한 공동구매 목록을 필터링 및 페이징 조회
     * 
     * @param memberId 회원 ID
     * @param search 검색어 (제목)
     * @param category 카테고리 (null이면 전체)
     * @param pageable 페이징 정보
     * @return 필터링된 참여 공동구매 목록
     */
    @Query("""
        SELECT p.groupBuying
        FROM Participant p
        WHERE p.member.id = :memberId
        AND (:search IS NULL OR :search = '' OR LOWER(CAST(p.groupBuying.title AS string)) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:category IS NULL OR p.groupBuying.category = :category)
        ORDER BY p.joinedAt DESC
        """)
    Page<GroupBuying> findMyParticipatingGroupBuyingsWithFilters(
            @Param("memberId") Long memberId,
            @Param("search") String search,
            @Param("category") Category category,
            Pageable pageable
    );
}
