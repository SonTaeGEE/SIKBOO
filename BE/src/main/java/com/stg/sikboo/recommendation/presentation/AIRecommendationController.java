package com.stg.sikboo.recommendation.presentation;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.stg.sikboo.recommendation.dto.RecommendationResponse;
import com.stg.sikboo.recommendation.service.AIRecommendationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIRecommendationController {
    
    private final AIRecommendationService aiRecommendationService;
    
    @GetMapping("/daily-recommendation")
    public RecommendationResponse getDailyRecommendation(
        @AuthenticationPrincipal Jwt jwt
    ) {
        Long memberId = extractMemberId(jwt);
        String message = aiRecommendationService.generateDailyRecommendation(memberId);
        return new RecommendationResponse(message);
    }
    
    /**
     * JWT에서 memberId 클레임 추출
     */
    private Long extractMemberId(Jwt jwt) {
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
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "memberId 파싱 실패");
            }
        }
        
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "memberId 클레임이 없습니다.");
    }
}
