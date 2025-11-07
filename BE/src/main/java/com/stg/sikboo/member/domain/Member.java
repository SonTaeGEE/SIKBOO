package com.stg.sikboo.member.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity 
@Table(name = "member")
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Member {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "member_id")
  private Long id;

  private String name;

  private String disease;
  private String allergy;

  @Column(nullable = false)
  private String provider = "LOCAL";   // LOCAL/GOOGLE/KAKAO/NAVER

  @Column(name = "provider_id")
  private String providerId;           // 외부 고유 ID

  @Column(nullable = false)
  private String role = "USER";        // USER/ADMIN

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @PrePersist void onCreate(){ if(createdAt==null) createdAt = LocalDateTime.now(); }

}
