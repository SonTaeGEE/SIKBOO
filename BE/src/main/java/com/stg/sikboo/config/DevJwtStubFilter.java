package com.stg.sikboo.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Slf4j
@Profile("dev")
@Component
public class DevJwtStubFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri == null || !uri.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String devId = req.getHeader("X-DEV-MEMBER-ID");
            if (devId != null && !devId.isBlank()) {
                Instant now = Instant.now();
                Jwt jwt = Jwt.withTokenValue("dev-token-" + devId)
                        .header("alg", "none")
                        .subject(devId)
                        .issuedAt(now)
                        .expiresAt(now.plus(1, ChronoUnit.HOURS))
                        .claims(c -> c.putAll(Map.of("memberId", devId, "scope", "user")))
                        .build();

                AbstractAuthenticationToken auth =
                        new JwtAuthenticationToken(jwt, AuthorityUtils.createAuthorityList("ROLE_USER"));
                SecurityContextHolder.getContext().setAuthentication(auth);
                log.info("[DEV STUB] memberId={} 인증 주입", devId); // ★ 확인 로그
            }
        }
        chain.doFilter(req, res);
    }
}
