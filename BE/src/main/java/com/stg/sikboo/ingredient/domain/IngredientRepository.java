package com.stg.sikboo.ingredient.domain;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    // 목록 + 검색
    @Query(
      value = """
        SELECT i.*
        FROM ingredient i
        WHERE i.member_id = :memberId
          AND (:location IS NULL OR i.location::text = :location)
          AND (:q IS NULL OR lower(i.ingredient_name) LIKE lower(concat('%', :q, '%')))
      	ORDER BY i.due ASC, i.ingredient_name ASC
      """,
      countQuery = """
        SELECT count(*)
        FROM ingredient i
        WHERE i.member_id = :memberId
          AND (:location IS NULL OR i.location::text = :location)
          AND (:q IS NULL OR lower(i.ingredient_name) LIKE lower(concat('%', :q, '%')))
      """,
      nativeQuery = true
    )
    Page<Ingredient> search(
        @Param("memberId") Long memberId,
        @Param("location") String location,   // 서비스에서 enum → name() 으로 바꿔 String 전달
        @Param("q") String q,
        Pageable pageable
    );

    // 중복 후보 조회 
    // "같은 위치(location)에, 같은 날짜 구간(start <= due < end)에 있는" 레코드들을 조회
    // - 서비스에서 이름 정규화(norm)하여 "이름이 같은지"를 최종 비교
    @Query(
      value = """
        SELECT i.*
        FROM ingredient i
        WHERE i.member_id = :memberId
          AND i.location::text = :location
          AND i.due >= :start AND i.due < :end
      """,
      nativeQuery = true
    )
    List<Ingredient> findDupCandidates(
        @Param("memberId") Long memberId,
        @Param("location") String location,   // enum → name() 으로 받은 문자열
        @Param("start") LocalDateTime startInclusive,  // 해당 날짜의 00:00 (포함)
        @Param("end") LocalDateTime endExclusive       // 다음날 00:00 (제외)
    );

    // 단건 조회(소유자 일치)
    Optional<Ingredient> findByIdAndMemberId(Long id, Long memberId);
}
