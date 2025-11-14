package com.stg.sikboo.recipe.domain.repository;

import com.stg.sikboo.recipe.domain.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    /** display_order 기준으로 정렬된 목록 */
    List<Recipe> findByMemberIdOrderByDisplayOrderAsc(Long memberId);

    /** 해당 회원의 현재 최대 display_order (없으면 0) */
    @Query("select coalesce(max(r.displayOrder), 0) from Recipe r where r.memberId = :memberId")
    Long findMaxDisplayOrderByMemberId(@Param("memberId") Long memberId);

    /** 재정렬 시, 회원 + id 리스트로 필요한 것만 조회 */
    List<Recipe> findByMemberIdAndIdIn(Long memberId, List<Long> ids);
}
