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

  private final CustomOAuth2UserService customOAuth2UserService;
  private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

  @Value("${app.frontend-url:http://localhost:5173}")
  private String FRONTEND_URL;

  @Value("${app.cors.allowed-origins:}")
  private String allowedOriginsCsv;

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http,
                                  ClientRegistrationRepository clientRegistrationRepository) throws Exception {

    // --- 카카오용: PKCE 파라미터 제거(code_challenge, code_challenge_method) ---
    var delegate = new DefaultOAuth2AuthorizationRequestResolver(
        clientRegistrationRepository, "/oauth2/authorization");

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
        // 상수 충돌 방지: 문자열 리터럴로 제거
        additional.remove("code_challenge");
        additional.remove("code_challenge_method");

        return OAuth2AuthorizationRequest.from(original)
            .additionalParameters(additional)
            .build();
      }
    };
    // -----------------------------------------------------------------------

    http
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
      .csrf(c -> c.ignoringRequestMatchers("/api/**","/auth/**"))
      .cors(c -> c.configurationSource(cors()))

      .authorizeHttpRequests(a -> a
        .requestMatchers("/", "/login", "/oauth2/**", "/login/oauth2/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/health").permitAll()
        .requestMatchers(HttpMethod.POST, "/auth/refresh").permitAll()
        .anyRequest().authenticated()
      )

      .oauth2Login(o -> o
        .authorizationEndpoint(ep -> ep.authorizationRequestResolver(noPkceForKakaoResolver))
        .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
        .successHandler(oAuth2LoginSuccessHandler)
        .failureHandler((req, res, ex) -> {
          String target = FRONTEND_URL + "/login?error=" + ex.getClass().getSimpleName();
          res.sendRedirect(target);
        })
      )

      .oauth2ResourceServer(rs -> rs
        .jwt(Customizer.withDefaults())
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
      if (cs != null) {
        for (var c : cs) {
          if ("ACCESS".equals(c.getName())) return c.getValue();
        }
      }
      return null;
    };
  }

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
    cfg.setAllowedOriginPatterns(origins);
    cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setAllowCredentials(true);
    cfg.setExposedHeaders(List.of("Authorization"));

    var src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }
}
