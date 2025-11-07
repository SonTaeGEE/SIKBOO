package com.stg.sikboo.auth.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

@Entity 
@Table(name = "refresh_token")
@Data
public class RefreshToken {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "refresh_id")
  private Long id;

  @Column(name = "member_id", nullable = false)
  private Long memberId;

  @Column(nullable = false, length = 512)
  private String token; // ※ 운영에선 해시 저장 권장(스키마 그대로면 원문 저장)

  @Column(name = "expire_date", nullable = false)
  private LocalDateTime expireDate;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @PrePersist void onCreate(){ if(createdAt==null) createdAt = LocalDateTime.now(); }

}
