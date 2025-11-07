package com.stg.sikboo.recipe.dto.response;

import java.util.List;

public record RecipeSuggestionResponse(
        Long id,
        String title,
        List<String> mainIngredients,
        List<String> seasoningIngredients,
        List<String> missing,
        String content
) {}
