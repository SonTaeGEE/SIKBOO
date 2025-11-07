package com.stg.sikboo.auth.presentation;

import com.stg.sikboo.member.domain.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken; // ★
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

  private final MemberRepository memberRepository; // ★ JWT의 sub로 회원 조회

  @GetMapping("/me")
  public Map<String, Object> me(Authentication auth) {
    if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

    // ★ JWT 기반 인증
    if (auth instanceof JwtAuthenticationToken jat) {
      Jwt jwt = jat.getToken();
      Long memberId = Long.valueOf(jwt.getSubject());

      var m = memberRepository.findById(memberId)
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

      return Map.of(
        "id", m.getId(),
        "name", m.getName(),
        "role", m.getRole()
      );
    }

    // (선택) 혹시 세션 기반 OAuth2User 로 들어올 때를 위한 안전장치
    Object p = auth.getPrincipal();
    if (p instanceof org.springframework.security.oauth2.core.user.OAuth2User o) {
      var attrs = o.getAttributes();
      return Map.of(
        "name", String.valueOf(attrs.getOrDefault("name",""))
      );
    }

    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
  }
}
