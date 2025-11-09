package com.stg.sikboo.ingredient.dto.response;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 표준 페이징 래퍼
 *
 *
 * 예시 응답(JSON)
 * {
 *   "content": [ { ...IngredientResponseDTO... }, ... ],
 *   "page": 0,
 *   "size": 20,
 *   "totalElements": 42,
 *   "totalPages": 3
 * }
 */
public record PageResponseDTO<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    /** Spring Data Page → API 표준 페이로드로 변환 */
    public static <T> PageResponseDTO<T> from(Page<T> p) {
        return new PageResponseDTO<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
        }
}
