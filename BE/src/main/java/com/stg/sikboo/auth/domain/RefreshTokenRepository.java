package com.stg.sikboo.auth.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
  Optional<RefreshToken> findByToken(String token);
  void deleteByMemberId(Long memberId);
  long deleteByExpireDateBefore(LocalDateTime now);
}
