package com.stg.sikboo.security;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
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
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final com.stg.sikboo.onboarding.infra.OnboardingGuardFilter onboardingGuardFilter;

    @Value("${app.frontend-url}")
    private String FRONTEND_URL;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           ClientRegistrationRepository clientRegistrationRepository)
            throws Exception {

        // --------- PKCE 제거 Resolver ---------
        var delegate = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository,
                "/api/oauth2/authorization"
        );

        OAuth2AuthorizationRequestResolver noPkceResolver = new OAuth2AuthorizationRequestResolver() {
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

                Map<String, Object> params = new HashMap<>(original.getAdditionalParameters());
                params.remove("code_challenge");
                params.remove("code_challenge_method");

                return OAuth2AuthorizationRequest
                        .from(original)
                        .additionalParameters(params)
                        .build();
            }
        };

        // --------- Security 설정 ---------
        http
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .csrf(c -> c.ignoringRequestMatchers("/api/**"))
                .cors(c -> c.configurationSource(cors()))

                .authorizeHttpRequests(a -> a
                        .requestMatchers("/", "/favicon.ico", "/error").permitAll()
                        .requestMatchers("/api/onboarding/**").permitAll()
                        .requestMatchers("/api/oauth2/**", "/api/login/**").permitAll()
                        .requestMatchers("/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/refresh").permitAll()
                        .anyRequest().authenticated()
                )

                .oauth2Login(o -> o
                        .authorizationEndpoint(ep ->
                                ep.authorizationRequestResolver(noPkceResolver)
                        )
                        .redirectionEndpoint(redir ->
                                redir.baseUri("/api/login/oauth2/code/*")
                        )
                        .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
                        .successHandler(oAuth2LoginSuccessHandler)
                        .failureHandler((req, res, ex) -> {
                            String target = FRONTEND_URL + "/login?error=" + ex.getClass().getSimpleName();
                            res.sendRedirect(target);
                        })
                )

                .oauth2ResourceServer(rs ->
                        rs.jwt(Customizer.withDefaults())
                                .bearerTokenResolver(cookieOrAuthHeader())
                )

                .exceptionHandling(ex ->
                        ex.defaultAuthenticationEntryPointFor(
                                (request, response, authException) -> {
                                    response.setStatus(401);
                                    response.setContentType("application/json;charset=UTF-8");
                                    response.getWriter().write(
                                            "{\"error\":\"UNAUTHORIZED\"}"
                                    );
                                },
                                request -> request.getRequestURI().startsWith("/api/")
                        )
                );

        http.addFilterAfter(onboardingGuardFilter, AnonymousAuthenticationFilter.class);

        return http.build();
    }

    // JWT → Authorization 헤더 > 없으면 ACCESS 쿠키
    @Bean
    public BearerTokenResolver cookieOrAuthHeader() {
        return request -> {
            String h = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (h != null && h.startsWith("Bearer ")) return h.substring(7);

            var cs = request.getCookies();
            if (cs != null) {
                for (var c : cs) {
                    if ("ACCESS".equals(c.getName())) {
                        return c.getValue();
                    }
                }
            }
            return null;
        };
    }

    // CORS 설정
    @Bean
    public CorsConfigurationSource cors() {
        var cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(
                "https://sikboo.vercel.app",
                "https://www.sikboo.shop",
                "https://sikboo.shop",
                "https://api.sikboo.shop"
        ));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);

        var src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }
}
