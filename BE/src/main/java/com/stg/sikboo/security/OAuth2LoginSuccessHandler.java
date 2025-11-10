package com.stg.sikboo.security;

import com.stg.sikboo.auth.domain.RefreshToken;
import com.stg.sikboo.auth.domain.RefreshTokenRepository;
import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.member.domain.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken; // ★ 추가
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.*;
import java.io.IOException;
import java.time.*;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

  private final JwtIssuer jwtIssuer;
  private final MemberRepository memberRepository;
  private final RefreshTokenRepository refreshTokenRepository;

  @Value("${app.frontend-url:http://localhost:5173}")
  String frontend;

  @Value("${app.cookie.secure:false}")
  boolean cookieSecure;

  @Value("${app.cookie.same-site:Lax}")
  String sameSite;

  @Override
  @Transactional
  public void onAuthenticationSuccess(HttpServletRequest req, HttpServletResponse res, Authentication auth) throws IOException {
    var principal = (OAuth2User) auth.getPrincipal();
    var oauth = (OAuth2AuthenticationToken) auth;                       // ★ provider 확인용
    String provider = oauth.getAuthorizedClientRegistrationId();        // google/kakao/naver
    Map<String,Object> a = principal.getAttributes();

    // ★ providerId/email 추출 (UserService에서 upsert 했으므로 DB에는 존재)
    String providerId = extractProviderId(provider, a);

    // ★ DB 조회: provider+providerId 우선, 없으면 email fallback
    // provider 대소문자 일관화(저장 시와 동일하게 저장되도록 맞출 것)
    Member m = memberRepository
        .findFirstByProviderAndProviderId(provider.toUpperCase(), providerId)
        .orElse(null);

    if (m == null) {
      // 이 경우는 거의 없지만, 복구 불가 시 로그인 페이지로 돌려보냄
      res.sendRedirect(frontend + "/login?error=MemberNotFound");
      return;
    }

    // 토큰 발급
    String access  = jwtIssuer.access(m.getId(), java.util.List.of("ROLE_" + m.getRole()), Duration.ofMinutes(60));
    String refresh = jwtIssuer.refresh(m.getId(), Duration.ofDays(14));

    // 회전: 기존 리프레시 제거 후 새로 저장
    refreshTokenRepository.deleteByMemberId(m.getId());
    var row = new RefreshToken();
    row.setMemberId(m.getId());
    row.setToken(refresh);
    row.setExpireDate(LocalDateTime.now().plusDays(14));
    refreshTokenRepository.save(row);

    // ★ 쿠키 세팅(백엔드 도메인용) — 분리 도메인에서 쿠키 인증을 쓰려면 SameSite=None + Secure 필요(운영)
    res.addHeader(HttpHeaders.SET_COOKIE, cookie("ACCESS", access, 1800, true));
    res.addHeader(HttpHeaders.SET_COOKIE, cookie("REFRESH", refresh, 14*24*3600, true));

    // // ★ 프론트 성공 페이지로 redirect
    // //    개발 편의상 access 토큰을 쿼리로도 전달 → 프론트에서 localStorage에 저장 후 Bearer 사용 가능
    // //    운영에서 URL 토큰 전달을 막으려면 아래 target에서 "?token=..." 부분을 제거하세요.
    // String target = frontend + "/oauth2/success?token=" + access;
    // res.sendRedirect(target);
    // ★ 프론트 성공 페이지로 redirect (보안: URL에 토큰 노출 금지)
    String target = frontend + "/oauth2/success";
    res.sendRedirect(target);
  }

  private String cookie(String name, String value, int maxAgeSec, boolean httpOnly) {
    return ResponseCookie.from(name, value)
        .httpOnly(httpOnly)
        .secure(cookieSecure)       // 운영: true + HTTPS
        .sameSite(sameSite)         // 분리 도메인 + 쿠키 인증시 운영은 "None"
        .path("/")
        .maxAge(maxAgeSec)
        .build().toString();
  }

  // ★ provider별 providerId 추출
  private String extractProviderId(String provider, Map<String, Object> a) {
    return switch (provider) {
      case "google" -> String.valueOf(a.get("sub"));
      case "kakao"  -> String.valueOf(a.get("id"));
      case "naver"  -> {
        Map<String,Object> r = (Map<String,Object>) a.get("response");
        yield r != null ? (String) r.get("id") : null;
      }
      default -> null;
    };
  }
}
