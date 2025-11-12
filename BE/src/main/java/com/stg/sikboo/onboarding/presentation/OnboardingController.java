package com.stg.sikboo.onboarding.presentation;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.stg.sikboo.onboarding.dto.request.OnboardingRequest;
import com.stg.sikboo.onboarding.dto.response.OnboardingResponse;
import com.stg.sikboo.onboarding.service.OnboardingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService service;

    @PostMapping
    public OnboardingResponse submit(@RequestBody OnboardingRequest req) {
        Long memberId = currentMemberId();
        return service.submitAll(memberId, req);
    }

    @PostMapping("/skip")
    public OnboardingResponse skip() {
        Long memberId = currentMemberId();
        return service.submitAll(memberId, new OnboardingRequest(null, null, true));
    }

    private Long currentMemberId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Object p = auth.getPrincipal();
        if (p instanceof Jwt jwt) {
            Object v = jwt.getClaim("memberId");
            if (v instanceof Integer i) return i.longValue();
            if (v instanceof Long l) return l;
            if (v instanceof String s) return Long.parseLong(s);
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "memberId 클레임이 없습니다.");
    }
}
