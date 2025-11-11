package com.stg.sikboo.member.domain;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(
    name = "member",
    uniqueConstraints = {
        // (provider, provider_id) 복합 유니크 - DDL과 동일한 제약명 사용
        @UniqueConstraint(name = "uq_member_provider_providerid", columnNames = {"provider", "provider_id"})
    }
)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Member {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY) // BIGSERIAL과 호환
  @Column(name = "member_id")
  private Long id;

  @Column(nullable = false, unique = true, length = 100) // name UNIQUE
  private String name;

  // PostgreSQL TEXT[] 매핑 (Hibernate 6)
  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "diseases", columnDefinition = "text[]", nullable = false)
  private String[] diseases;   // 기존 String disease -> String[] 로 교체

  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "allergies", columnDefinition = "text[]", nullable = false)
  private String[] allergies;  // 기존 String allergy -> String[] 로 교체

  @Column(nullable = false, length = 30)
  @Builder.Default
  private String provider = "LOCAL";   // LOCAL/GOOGLE/KAKAO/NAVER

  @Column(name = "provider_id", length = 100)
  private String providerId;           // 외부 고유 ID

  @Column(nullable = false, length = 20)
  @Builder.Default
  private String role = "USER";        // USER/ADMIN

  @Column(name = "onboarding_completed", nullable = false)
  @Builder.Default
  private boolean onboardingCompleted = false;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @PrePersist
  void onCreate() {
    if (createdAt == null) createdAt = LocalDateTime.now();
    if (diseases == null)  diseases  = new String[]{}; // DDL의 DEFAULT '{}' 대응
    if (allergies == null) allergies = new String[]{}; // DDL의 DEFAULT '{}' 대응
  }
}
