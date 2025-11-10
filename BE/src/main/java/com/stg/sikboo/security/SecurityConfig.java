package com.stg.sikboo.security;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  // OAuth2 프로필 처리 서비스 (Member 생성/갱신)
  private final CustomOAuth2UserService customOAuth2UserService;
  // OAuth2 로그인 성공 시 JWT 발급/쿠키 설정/리다이렉트 처리 핸들러
  private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

  @Value("${app.frontend-url:}")
  private String FRONTEND_URL;

  @Value("${app.cors.allowed-origins:}")
  private String allowedOriginsCsv;

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http,
                                  ClientRegistrationRepository clientRegistrationRepository) throws Exception {

    // --- 카카오용: PKCE 파라미터 제거(code_challenge, code_challenge_method)
    // 기본 인가 요청 resolver의 base URI를 "/api/oauth2/authorization"으로 변경하여 /api 네임스페이스 통일
    var delegate = new DefaultOAuth2AuthorizationRequestResolver(
        clientRegistrationRepository, "/api/oauth2/authorization");

    OAuth2AuthorizationRequestResolver noPkceForKakaoResolver = new OAuth2AuthorizationRequestResolver() {
      @Override
      public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        return customize(delegate.resolve(request));
      }
      @Override
      public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        return customize(delegate.resolve(request, clientRegistrationId));
      }
      private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest original) {
        if (original == null) return null;

        String registrationId = (String) original.getAttributes().get("registration_id");
        if (!"kakao".equalsIgnoreCase(registrationId)) return original;

        Map<String, Object> additional = new HashMap<>(original.getAdditionalParameters());
        // 카카오와 충돌할 수 있는 PKCE 파라미터 제거
        additional.remove("code_challenge");
        additional.remove("code_challenge_method");

        return OAuth2AuthorizationRequest.from(original)
            .additionalParameters(additional)
            .build();
      }
    };
    // -----------------------------------------------------------------------

    http
      // 세션 정책: 현재 IF_REQUIRED. 완전 JWT stateless면 STATELESS로 변경 가능.
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

      // CSRF 보호 예외: API 네임스페이스 전체를 제외("/api/**")
      .csrf(c -> c.ignoringRequestMatchers("/api/**"))

      // CORS 설정: 별도 cors() 빈에서 구성
      .cors(c -> c.configurationSource(cors()))

      .authorizeHttpRequests(a -> a
        // 정적 루트와 에러 페이지는 공개
        .requestMatchers("/", "/favicon.ico", "/error").permitAll()

        // 팀 규칙에 맞춰 OAuth 인가/콜백과 로그인 엔드포인트를 /api 아래로 통일하여 허용
        // 예: "/api/oauth2/authorization/kakao", "/api/login/oauth2/code/kakao" 등
        .requestMatchers("/api/oauth2/**", "/api/login/**").permitAll()

        // 헬스체크 공개
        .requestMatchers(HttpMethod.GET, "/health").permitAll()

        // 리프레시 토큰 회전 엔드포인트: "/api/auth/refresh" 사용
        .requestMatchers(HttpMethod.POST, "/api/auth/refresh").permitAll()

        // 위에 명시되지 않은 모든 요청은 인증 필요
        .anyRequest().authenticated()
      )

      // OAuth2 로그인 설정
      .oauth2Login(o -> o
        // 인가 엔드포인트 요청 생성기를 커스터마이즈하여 PKCE 제거 적용
        .authorizationEndpoint(ep -> ep.authorizationRequestResolver(noPkceForKakaoResolver))

        // 리다이렉트(콜백) 엔드포인트를 /api 네임스페이스로 변경하여
        // Spring이 만들어내는 redirect_uri를 "http(s)://{host}/api/login/oauth2/code/{registrationId}"로 맞춤
        .redirectionEndpoint(redir -> redir.baseUri("/api/login/oauth2/code/*"))

        // provider로부터 받은 사용자 정보를 처리할 서비스 연결
        .userInfoEndpoint(u -> u.userService(customOAuth2UserService))

        // 로그인 성공/실패 핸들러 설정
        .successHandler(oAuth2LoginSuccessHandler)
        .failureHandler((req, res, ex) -> {
          // 실패 시 프론트의 /login 페이지로 에러 타입을 쿼리로 전달해서 리다이렉트
          String target = FRONTEND_URL + "/login?error=" + ex.getClass().getSimpleName();
          res.sendRedirect(target);
        })
      )

      // 리소스 서버 설정: JWT 검증 사용, 토큰 해석은 커스터마이즈된 resolver 사용
      .oauth2ResourceServer(rs -> rs
        .jwt(Customizer.withDefaults())
        .bearerTokenResolver(cookieOrAuthHeader())
      );

    return http.build();
  }

  // Authorization 헤더 우선 > 없으면 쿠키("ACCESS")에서 토큰 읽기
  @Bean
  BearerTokenResolver cookieOrAuthHeader() {
    return request -> {
      // 1) Authorization 헤더에서 Bearer 토큰 추출
      String h = request.getHeader(HttpHeaders.AUTHORIZATION);
      if (h != null && h.startsWith("Bearer ")) return h.substring(7);

      // 2) 헤더가 없으면 쿠키에서 ACCESS 이름의 쿠키 값을 사용
      var cs = request.getCookies();
      if (cs != null) {
        for (var c : cs) {
          if ("ACCESS".equals(c.getName())) return c.getValue();
        }
      }
      // 3) 토큰이 없으면 null 반환 -> 인증 실패 처리
      return null;
    };
  }

  // CORS 설정: allowedOriginsCsv가 있으면 그 값을 사용하고 없으면 FRONTEND_URL 사용
  @Bean
  CorsConfigurationSource cors() {
    var cfg = new CorsConfiguration();

    List<String> origins;
    if (allowedOriginsCsv != null && !allowedOriginsCsv.isBlank()) {
      origins = Arrays.stream(allowedOriginsCsv.split(","))
                      .map(String::trim)
                      .filter(s -> !s.isBlank())
                      .toList();
    } else {
      origins = List.of(FRONTEND_URL);
    }
    cfg.setAllowedOrigins(origins);

    cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setAllowCredentials(true);
    cfg.setExposedHeaders(List.of("Authorization"));

    var src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }
}