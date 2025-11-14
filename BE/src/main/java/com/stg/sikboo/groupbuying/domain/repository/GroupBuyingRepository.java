package com.stg.sikboo.groupbuying.domain.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
    
    /**
     * 특정 상태이면서 마감 시간이 지난 공동구매 목록 조회 (스케줄러용)
     */
    List<GroupBuying> findByStatusAndDeadlineBefore(Status status, LocalDateTime deadline);
    
    /**
     * 통합 필터링 및 페이징 조회 (거리 계산 포함)
     * Haversine 공식으로 거리 계산: (6371 * acos(cos(radians(lat)) * cos(radians(pickupLat)) * cos(radians(pickupLng) - radians(lng)) + sin(radians(lat)) * sin(radians(pickupLat))))
     * 
     * @param search 검색어 (제목)
     * @param category 카테고리 (null이면 전체)
     * @param status 상태 (null이면 전체)
     * @param userLat 사용자 위도 (null이면 거리 필터 미적용)
     * @param userLng 사용자 경도 (null이면 거리 필터 미적용)
     * @param maxDistance 최대 거리 (km) (null이면 거리 필터 미적용)
     * @param pageable 페이징 정보
     * @return 필터링된 공동구매 목록 (거리 정보 포함)
     */
    @Query(value = """
        SELECT gb, 
        CASE 
            WHEN :userLat IS NULL OR :userLng IS NULL THEN NULL
            ELSE (6371 * acos(
                cos(radians(:userLat)) * cos(radians(CAST(gb.pickupLatitude AS double))) * 
                cos(radians(CAST(gb.pickupLongitude AS double)) - radians(:userLng)) + 
                sin(radians(:userLat)) * sin(radians(CAST(gb.pickupLatitude AS double)))
            ))
        END as distance
        FROM GroupBuying gb
        WHERE (:search IS NULL OR :search = '' OR LOWER(CAST(gb.title AS string)) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:category IS NULL OR gb.category = :category)
        AND (:status IS NULL OR gb.status = :status)
        AND (:userLat IS NULL OR :userLng IS NULL OR :maxDistance IS NULL OR
            (6371 * acos(
                cos(radians(:userLat)) * cos(radians(CAST(gb.pickupLatitude AS double))) * 
                cos(radians(CAST(gb.pickupLongitude AS double)) - radians(:userLng)) + 
                sin(radians(:userLat)) * sin(radians(CAST(gb.pickupLatitude AS double)))
            )) <= :maxDistance)
        ORDER BY 
            CASE 
                WHEN :userLat IS NOT NULL AND :userLng IS NOT NULL THEN 
                    (6371 * acos(
                        cos(radians(:userLat)) * cos(radians(CAST(gb.pickupLatitude AS double))) * 
                        cos(radians(CAST(gb.pickupLongitude AS double)) - radians(:userLng)) + 
                        sin(radians(:userLat)) * sin(radians(CAST(gb.pickupLatitude AS double)))
                    ))
                ELSE 999999
            END ASC,
            gb.createdAt DESC
        """,
        countQuery = """
        SELECT COUNT(gb)
        FROM GroupBuying gb
        WHERE (:search IS NULL OR :search = '' OR LOWER(CAST(gb.title AS string)) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:category IS NULL OR gb.category = :category)
        AND (:status IS NULL OR gb.status = :status)
        AND (:userLat IS NULL OR :userLng IS NULL OR :maxDistance IS NULL OR
            (6371 * acos(
                cos(radians(:userLat)) * cos(radians(CAST(gb.pickupLatitude AS double))) * 
                cos(radians(CAST(gb.pickupLongitude AS double)) - radians(:userLng)) + 
                sin(radians(:userLat)) * sin(radians(CAST(gb.pickupLatitude AS double)))
            )) <= :maxDistance)
        """)
    Page<Object[]> findWithFiltersAndDistance(
            @Param("search") String search,
            @Param("category") Category category,
            @Param("status") Status status,
            @Param("userLat") Double userLat,
            @Param("userLng") Double userLng,
            @Param("maxDistance") Double maxDistance,
            Pageable pageable
    );
}
