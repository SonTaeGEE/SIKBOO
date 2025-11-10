package com.stg.sikboo.ingredient.dto.request;

import com.stg.sikboo.ingredient.domain.IngredientLocation;

/**
 * 재료 생성 요청 DTO
 *
 *
 * 예시 요청(JSON)
 * {
 *   "ingredientName": "대파",
 *   "location": "냉장고",
 *   "due": "2025-11-30",
 *   "memo": "볶음용"           // 선택
 * }
 *
 */
public record CreateIngredientRequestDTO(
        String ingredientName,
        IngredientLocation location,
        String due,   // "YYYY-MM-DD"
        String memo
) {}
