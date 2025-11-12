package com.stg.sikboo.ingredient.dto.response;

import java.time.LocalDate;
import java.time.ZoneId;

import com.stg.sikboo.ingredient.domain.Ingredient;
import com.stg.sikboo.ingredient.domain.IngredientLocation;

/**
 * 재료 단건 응답 DTO
 *
 * 예시 응답(JSON)
 * {
 *   "id": 141,
 *   "ingredientName": "대파",
 *   "location": "냉장고",
 *   "due": "2025-11-30",
 *   "daysLeft": 23,
 *   "isDueEstimated": true,
 *   "isExpired": false,
 *   "memo": "볶음용"
 * }
 */
public record IngredientResponseDTO(
        Long id,
        String ingredientName,
        IngredientLocation location,
        String due,          // "YYYY-MM-DD"
        long daysLeft,       // 오늘 기준 남은 일수(음수면 지남)
        boolean isDueEstimated, // 서버 추정값 여부
        boolean isExpired,   // 소비기한 지남 여부
        String memo
) {
    /** 엔티티 → 응답 DTO 변환(KST 등 타임존 기준 D-Day 계산 포함) */
    public static IngredientResponseDTO from(Ingredient i, ZoneId zone) {
        var dueDate = i.getDue().toLocalDate();
        long days = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(zone), dueDate);
        return new IngredientResponseDTO(
                i.getId(),
                i.getIngredientName(),
                i.getLocation(),
                dueDate.toString(),
                days,
                i.isDueEstimated(), 
                days < 0,
                i.getMemo()
        );
    }
}
