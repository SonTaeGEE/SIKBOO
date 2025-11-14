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

    /** 사용자가 정렬한 순서를 저장하는 컬럼 (1,2,3...) */
    @Column(name = "display_order", nullable = false)
    private Long displayOrder;

    public Long getId() { return id; }
    public Long getMemberId() { return memberId; }
    public String getName() { return name; }
    public String getDetail() { return detail; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getDisplayOrder() { return displayOrder; }

    public void setMemberId(Long memberId) { this.memberId = memberId; }
    public void setName(String name) { this.name = name; }
    public void setDetail(String detail) { this.detail = detail; }
    public void setDisplayOrder(Long displayOrder) { this.displayOrder = displayOrder; }
}
