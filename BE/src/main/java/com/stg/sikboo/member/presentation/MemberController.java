package com.stg.sikboo.member.presentation;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class MemberController {
  @GetMapping("/member")
  public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
    return Map.of(
      "memberId", jwt.getSubject(),
      "roles", jwt.getClaimAsStringList("roles")
    );
  }
}
