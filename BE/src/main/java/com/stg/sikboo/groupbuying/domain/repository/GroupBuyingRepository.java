package com.stg.sikboo.groupbuying.domain.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.stg.sikboo.groupbuying.domain.GroupBuying;
import com.stg.sikboo.groupbuying.domain.GroupBuying.Category;
import com.stg.sikboo.groupbuying.domain.GroupBuying.Status;

/**
 * GroupBuying 도메인 리포지토리
 * DDD 아키텍처에서 도메인 계층에 위치
 */
public interface GroupBuyingRepository extends JpaRepository<GroupBuying, Long> {
    
    List<GroupBuying> findByStatus(Status status);
    
    List<GroupBuying> findByCategory(Category category);
    
    List<GroupBuying> findByMember_Id(Long memberId);

    List<GroupBuying> findByTitleContaining(String title);
    
    List<GroupBuying> findByDeadlineAfter(LocalDateTime deadline);
    
    List<GroupBuying> findByStatusAndDeadlineAfter(Status status, LocalDateTime deadline);
}
