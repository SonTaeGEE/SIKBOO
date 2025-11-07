package com.stg.sikboo.recipe.domain.repository;

import com.stg.sikboo.recipe.domain.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByMemberId(Long memberId);
}
