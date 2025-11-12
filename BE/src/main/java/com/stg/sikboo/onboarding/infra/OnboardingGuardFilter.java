// filepath: BE/src/main/java/com/stg/sikboo/onboarding/infra/OnboardingGuardFilter.java
package com.stg.sikboo.onboarding.infra;

import java.io.IOException;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.member.domain.MemberRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class OnboardingGuardFilter extends OncePerRequestFilter {

    private final MemberRepository memberRepo;

    // ⬇️ 온보딩 체크 제외 경로
    private static final Set<String> WHITELIST = Set.of(
        "/api/onboarding",
        "/api/ingredients/analyze-text", // AI 분석(온보딩 중 허용)
        "/api/auth/me",
        "/api/auth/logout",
        "/api/auth/refresh",
        "/api/members/me/profile",
        "/api/health"
    );

    @Override
    protected void doFilterInternal(
        HttpServletRequest req,
        HttpServletResponse res,
        FilterChain chain
    ) throws ServletException, IOException {

        String uri = req.getRequestURI();

        // 1) OPTIONS 요청 통과
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        // 2) 화이트리스트 경로 통과
        if (shouldSkipOnboardingCheck(uri)) {
            log.debug("온보딩 체크 제외: {}", uri);
            chain.doFilter(req, res);
            return;
        }

        // 3) /api/* 경로가 아니면 통과
        if (!uri.startsWith("/api/")) {
            chain.doFilter(req, res);
            return;
        }

        // 4) 인증되지 않은 사용자는 Security가 처리
        Long memberId = extractMemberIdFromAuth();
        if (memberId == null) {
            log.debug("인증되지 않은 요청: {}", uri);
            chain.doFilter(req, res);
            return;
        }

        // 5) 온보딩 완료 여부 확인
        boolean isCompleted = memberRepo.findById(memberId)
                .map(Member::isOnboardingCompleted)
                .orElse(true);

        if (!isCompleted) {
            log.warn("온보딩 미완료 차단: memberId={}, uri={}", memberId, uri);
            sendOnboardingRequiredResponse(res);
            return;
        }

        log.debug("온보딩 완료 접근 허용: memberId={}, uri={}", memberId, uri);
        chain.doFilter(req, res);
    }

    private boolean shouldSkipOnboardingCheck(String uri) {
        return WHITELIST.stream().anyMatch(uri::startsWith);
    }

    private Long extractMemberIdFromAuth() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return null;
            }

            Object principal = auth.getPrincipal();
            if (principal instanceof Jwt jwt) {
                Object claim = jwt.getClaim("memberId");
                
                if (claim instanceof Integer) {
                    return ((Integer) claim).longValue();
                }
                if (claim instanceof Long) {
                    return (Long) claim;
                }
                if (claim instanceof String) {
                    try {
                        return Long.parseLong((String) claim);
                    } catch (NumberFormatException e) {
                        log.warn("memberId 파싱 실패: {}", claim);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("memberId 추출 실패", e);
        }
        return null;
    }

    private void sendOnboardingRequiredResponse(HttpServletResponse res) throws IOException {
        res.setStatus(428); // Precondition Required
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"needOnboarding\":true,\"redirect\":\"/onboarding\"}");
    }
}
//package com.stg.sikboo.onboarding.infra;
//
//import java.io.IOException;
//import java.util.List;
//
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.security.oauth2.jwt.Jwt;
//import org.springframework.stereotype.Component;
//import org.springframework.web.filter.OncePerRequestFilter;
//
//import com.stg.sikboo.member.domain.MemberRepository;
//
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import lombok.RequiredArgsConstructor;
//
//@Component
//@RequiredArgsConstructor
//public class OnboardingGuardFilter extends OncePerRequestFilter {
//
//    private final MemberRepository memberRepo;
//
//    private static final List<String> WHITELIST = List.of(
//        "/api/onboarding", "/api/onboarding/skip",
//        "/auth", "/login", "/logout", "/public"
//    );
//
//    @Override
//    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
//            throws ServletException, IOException {
//
//        String path = req.getRequestURI();
//        if (isWhitelisted(path) || "OPTIONS".equalsIgnoreCase(req.getMethod())) {
//            chain.doFilter(req, res);
//            return;
//        }
//
//        Long memberId = currentMemberIdOrNull();
//        if (memberId == null) {
//            chain.doFilter(req, res);
//            return;
//        }
//
//        boolean completed = memberRepo.findById(memberId)
//                .map(m -> m.isOnboardingCompleted())
//                .orElse(true); // 멤버 없으면 통과
//
//        if (!completed) {
//            res.setStatus(428); // Precondition Required
//            res.setContentType("application/json");
//            res.getWriter().write("{\"needOnboarding\":true,\"redirect\":\"/onboarding\"}");
//            return;
//        }
//        chain.doFilter(req, res);
//    }
//
//    private boolean isWhitelisted(String path) {
//        return WHITELIST.stream().anyMatch(path::startsWith);
//    }
//
//    private Long currentMemberIdOrNull() {
//        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
//        if (auth == null) return null;
//        Object p = auth.getPrincipal();
//        if (p instanceof Jwt jwt) {
//            Object v = jwt.getClaim("memberId");
//            if (v instanceof Integer i) return i.longValue();
//            if (v instanceof Long l) return l;
//            if (v instanceof String s) try { return Long.parseLong(s); } catch (Exception ignore) {}
//        }
//        return null;
//    }
//}
