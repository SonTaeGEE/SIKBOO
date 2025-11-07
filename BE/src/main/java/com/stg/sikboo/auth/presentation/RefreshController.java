package com.stg.sikboo.auth.presentation;

import com.stg.sikboo.auth.domain.RefreshToken;
import com.stg.sikboo.auth.domain.RefreshTokenRepository;
import com.stg.sikboo.security.JwtIssuer;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class RefreshController {

  private final JwtDecoder jwtDecoder;       // secret-key 기반 자동 구성
  private final JwtIssuer jwtIssuer;
  private final RefreshTokenRepository refreshTokenRepository;

  @PostMapping("/refresh")
  public ResponseEntity<Void> refresh(@CookieValue(value="REFRESH", required=false) String refreshToken) {
    if (refreshToken == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

    Jwt jwt;
    try { jwt = jwtDecoder.decode(refreshToken); }
    catch (JwtException e) { return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); }

    if (!"refresh".equals(jwt.getClaimAsString("typ"))) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

    Long memberId = Long.valueOf(jwt.getSubject());
    var rowOpt = refreshTokenRepository.findByToken(refreshToken);
    if (rowOpt.isEmpty() || rowOpt.get().getMemberId() != memberId || rowOpt.get().getExpireDate().isBefore(LocalDateTime.now())) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // 회전: 이전 것 제거 → 새 Access/Refresh 발급
    refreshTokenRepository.deleteByMemberId(memberId);

    String newAccess  = jwtIssuer.access(memberId, List.of("ROLE_USER"), Duration.ofMinutes(30));
    String newRefresh = jwtIssuer.refresh(memberId, Duration.ofDays(14));
    var newRow = new RefreshToken();
    newRow.setMemberId(memberId);
    newRow.setToken(newRefresh);
    newRow.setExpireDate(LocalDateTime.now().plusDays(14));
    refreshTokenRepository.save(newRow);

    var headers = new HttpHeaders();
    headers.add(HttpHeaders.SET_COOKIE, cookie("ACCESS", newAccess, 1800));
    headers.add(HttpHeaders.SET_COOKIE, cookie("REFRESH", newRefresh, 14*24*3600));
    return new ResponseEntity<>(headers, HttpStatus.NO_CONTENT);
  }

  private String cookie(String name, String value, int maxAge) {
    return ResponseCookie.from(name, value)
        .httpOnly(true)
        .secure(false)           // 운영전환: true & SameSite=None
        .sameSite("Lax")
        .path("/")
        .maxAge(maxAge)
        .build().toString();
  }
}
