package com.stg.sikboo.auth.presentation;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.stg.sikboo.auth.domain.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class LogoutController {

  private final JwtDecoder jwtDecoder;
  private final RefreshTokenRepository refreshTokenRepository;

  @PostMapping("/auth/logout")
  public ResponseEntity<Void> logout(@CookieValue(value = "REFRESH", required = false) String refresh) {
    if (refresh != null) {
      try {
        var jwt = jwtDecoder.decode(refresh);
        Long memberId = Long.valueOf(jwt.getSubject());
        refreshTokenRepository.deleteByMemberId(memberId);
      } catch (Exception ignored) {}
    }
    var h = new HttpHeaders();
    h.add(HttpHeaders.SET_COOKIE, expire("ACCESS"));
    h.add(HttpHeaders.SET_COOKIE, expire("REFRESH"));
    return new ResponseEntity<>(h, HttpStatus.NO_CONTENT);
  }

  private String expire(String name) {
    return ResponseCookie.from(name, "")
        .maxAge(0).path("/")
        .httpOnly(true).secure(false).sameSite("Lax")
        .build().toString();
  }
}
