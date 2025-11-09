package com.stg.sikboo.ingredient.dto.request;

import com.stg.sikboo.ingredient.domain.IngredientLocation;

/**
 * 재료 부분수정 요청 DTO
 *
 *
 * 예시(부분 수정)
 * PATCH /api/ingredients/141
 * { "due": "2025-12-01" }
 *
 * 예시(여러 필드 동시)
 * { "ingredientName":"쪽파", "location":"실온", "memo":"국물용" }
 */
public record UpdateIngredientRequestDTO(
        String ingredientName,
        IngredientLocation location,
        String due,   // "YYYY-MM-DD"
        String memo
) {}
