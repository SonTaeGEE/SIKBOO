package com.stg.sikboo.member.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {
  // 중복이 있을 수 있으므로 첫 번째 결과만 반환하는 안전한 조회 메서드 추가
  Optional<Member> findFirstByProviderAndProviderId(String provider, String providerId);

  // ...other methods...
}