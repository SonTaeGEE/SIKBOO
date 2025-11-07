package com.stg.sikboo.recipe.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recipe")
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recipe_id")
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "recipe_name", nullable = false)
    private String name;

    @Column(name = "recipe_detail", nullable = false, length = 1000)
    private String detail;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public Long getMemberId() { return memberId; }
    public String getName() { return name; }
    public String getDetail() { return detail; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setMemberId(Long memberId) { this.memberId = memberId; }
    public void setName(String name) { this.name = name; }
    public void setDetail(String detail) { this.detail = detail; }
}
