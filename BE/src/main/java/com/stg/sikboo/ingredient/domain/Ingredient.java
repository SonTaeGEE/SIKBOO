package com.stg.sikboo.ingredient.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ingredient")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ingredient_id")
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "ingredient_name", nullable = false, length = 100)
    private String ingredientName;

    // DDL은 VARCHAR + CHECK 제약. Enum STRING 저장으로 호환됨.
    @Enumerated(EnumType.STRING)
    @Column(name = "location", nullable = false, length = 50)
    private IngredientLocation location;

    @Column(name = "due", nullable = false)
    private LocalDateTime due;

    // DDL 반영: NOT NULL DEFAULT TRUE
    @Column(name = "is_due_estimated", nullable = false)
    private boolean isDueEstimated;   // 기본 false (생성 시 명시적으로 세팅)

    @Column(name = "memo", length = 255)
    private String memo;
}
