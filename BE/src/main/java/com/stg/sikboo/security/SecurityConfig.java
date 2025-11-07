package com.stg.sikboo.security;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final CustomOAuth2UserService customOAuth2UserService;
  private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler; // ★ 유지

  @Value("${app.frontend-url:http://localhost:5173}")   // ★ 키 통일(frontend-url)
  private String FRONTEND_URL;

  @Value("${app.cors.allowed-origins:}")                 // 쉼표로 여러 개 허용 가능
  private String allowedOriginsCsv;

  private String jwtSecret;

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      // OAuth2 인가코드 플로우는 세션을 잠깐 사용 → IF_REQUIRED
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

      .csrf(c -> c.ignoringRequestMatchers("/api/**","/auth/**"))
      .cors(c -> c.configurationSource(cors()))

      .authorizeHttpRequests(a -> a
        // ★ 변경: /auth/** 전체 공개 → 제거
        .requestMatchers("/", "/login", "/oauth2/**", "/login/oauth2/**").permitAll() // ★ 변경
        .requestMatchers(HttpMethod.GET, "/health").permitAll()
        .requestMatchers(HttpMethod.POST, "/auth/refresh").permitAll()               // ★ 변경: refresh만 공개
        .anyRequest().authenticated()
      )

      .oauth2Login(o -> o
        .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
        .successHandler(oAuth2LoginSuccessHandler)
        .failureHandler((req, res, ex) -> {
          String target = FRONTEND_URL + "/login?error=" + ex.getClass().getSimpleName();
          res.sendRedirect(target);
        })
      )

      .oauth2ResourceServer(rs -> rs
        .jwt(Customizer.withDefaults())     // JwtDecoder 빈 사용
        .bearerTokenResolver(cookieOrAuthHeader())
      );

    return http.build();
  }

  // Authorization 헤더 > ACCESS 쿠키
  @Bean
  BearerTokenResolver cookieOrAuthHeader() {
    return request -> {
      String h = request.getHeader(HttpHeaders.AUTHORIZATION);
      if (h != null && h.startsWith("Bearer ")) return h.substring(7);
      var cs = request.getCookies();
      if (cs != null) for (var c : cs) if ("ACCESS".equals(c.getName())) return c.getValue();
      return null;
    };
  }

  @Bean
  CorsConfigurationSource cors() {
    var cfg = new CorsConfiguration();

    // 허용 오리진: app.cors.allowed-origins 있으면 우선, 없으면 FRONTEND_URL 사용
    List<String> origins;
    if (allowedOriginsCsv != null && !allowedOriginsCsv.isBlank()) {
      origins = Arrays.stream(allowedOriginsCsv.split(","))
                      .map(String::trim)
                      .filter(s -> !s.isBlank())
                      .toList();
    } else {
      origins = List.of(FRONTEND_URL);
    }
    cfg.setAllowedOriginPatterns(origins);      // 분리 도메인/서브도메인 패턴 대응
    cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setAllowCredentials(true);              // 쿠키 인증 허용
    cfg.setExposedHeaders(List.of("Authorization")); // (선택) 헤더 노출

    var src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }
}
