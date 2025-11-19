package com.stg.sikboo.recipe.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "recipe_vector")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecipeVector {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recipe_vector_id")
    private Long id;

    // TEXT 이므로 String 으로 매핑
    @Column(name = "rcp_seq")
    private String rcpSeq;

    // TEXT NOT NULL
    @Column(name = "title", nullable = false)
    private String title;

    // TEXT NOT NULL
    @Column(name = "ingredients", nullable = false)
    private String ingredients;

    // TEXT NOT NULL
    @Column(name = "steps", nullable = false)
    private String steps;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // 🔥 embedding 컬럼은 JPA 엔티티에 매핑하지 않는다.
    // - DB 타입: VECTOR(1536)
    // - 항상 native query (insertWithEmbedding, searchByEmbedding) 로만 다룬다.
}
