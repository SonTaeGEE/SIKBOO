package com.stg.sikboo.recipe.dto.request;

import java.util.List;

public record RecipeGenerateRequest(Long memberId, List<Long> ingredientIds) {}