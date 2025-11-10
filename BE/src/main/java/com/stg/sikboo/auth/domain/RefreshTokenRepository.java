package com.stg.sikboo.auth.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
  Optional<RefreshToken> findByToken(String token);

  @Modifying
  @Transactional
  void deleteByMemberId(Long memberId);

  @Modifying
  @Transactional
  long deleteByExpireDateBefore(LocalDateTime now);
}
