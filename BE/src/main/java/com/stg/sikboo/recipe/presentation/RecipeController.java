package com.stg.sikboo.recipe.presentation;

import com.stg.sikboo.recipe.dto.request.RecipeGenerateRequest;
import com.stg.sikboo.recipe.dto.response.RecipeSuggestionResponse;
import com.stg.sikboo.recipe.service.RecipeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173","http://127.0.0.1:5173"})
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    /** JWT에서 memberId 꺼내기 */
    private Long currentMemberId(Jwt jwt) {
        if (jwt == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 필요");
        Object mid = jwt.getClaim("memberId");
        if (mid instanceof Integer i) return i.longValue();
        if (mid instanceof Long l) return l;
        if (mid instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException ignored) {}
        }
        try { return Long.parseLong(jwt.getSubject()); } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "JWT에 memberId가 없습니다.");
        }
    }

    /** [생성 탭] 내 재료 목록 */
    @GetMapping("/ingredients/my")
    public ResponseEntity<List<Map<String, Object>>> myIngredients(@AuthenticationPrincipal Jwt jwt) {
        Long memberId = currentMemberId(jwt);
        return ResponseEntity.ok(recipeService.findMyIngredients(memberId));
    }

    /** [목록 탭] 레시피 조회 (filter = have | need, q는 제목 검색어) — 메모리 캐시 기반 */
    @GetMapping("/recipes")
    public ResponseEntity<List<RecipeSuggestionResponse>> listRecipes(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "filter", required = false) String filter,
            @RequestParam(name = "q", required = false) String q
    ) {
        Long memberId = currentMemberId(jwt);
        return ResponseEntity.ok(recipeService.listRecipes(memberId, filter, q));
    }

    /**
     * [생성 버튼] 레시피 생성(선택 재료 전달)
     * - AI 호출
     * - DB에 "방(세션)" 저장 (recipe_name = 방 제목, recipe_detail = AI JSON)
     * - 생성된 방의 {id, title} 반환
     */
    @PostMapping("/recipes/generate")
    public ResponseEntity<Map<String, Object>> generate(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody RecipeGenerateRequest req
    ) {
        Long memberId = currentMemberId(jwt);
        // memberId를 강제 세팅한 요청으로 생성 수행
        Map<String, Object> created = recipeService.generateRecipes(
                new RecipeGenerateRequest(memberId, req.ingredientIds())
        );
        // created = { "id": Long, "title": String }
        return ResponseEntity.ok(created);
    }

    /**
     * [다른 레시피 추천받기!]
     * - filter: have | need | null(둘 다)
     * - 최신 캐시에 중복 없는 레시피 추가
     */
    @PostMapping("/recipes/recommend-more")
    public ResponseEntity<Void> recommendMore(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "filter", required = false) String filter
    ) {
        Long memberId = currentMemberId(jwt);
        recipeService.recommendMore(memberId, filter);
        return ResponseEntity.ok().build();
    }

    // ==============================
    // 방(세션) 목록 & 상세 (DB 기반)
    // ==============================

    /** [방 목록] 내가 생성한 레시피 세션 리스트 (최근 생성 순) */
    @GetMapping("/recipes/sessions")
    public ResponseEntity<List<Map<String, Object>>> listSessions(@AuthenticationPrincipal Jwt jwt) {
        Long memberId = currentMemberId(jwt);
        // 각 아이템: { id: Long, title: String, createdAt: ISO-String }
        return ResponseEntity.ok(recipeService.listSessions(memberId));
    }

    /**
     * [방 상세] 하나의 세션 상세
     * - 반환: { id, title, createdAt, have: RecipeSuggestionResponse[], need: RecipeSuggestionResponse[] }
     * - have/need는 recipe_detail(JSON)을 파싱해 프론트 표준 DTO로 변환해 제공
     */
    @GetMapping("/recipes/sessions/{id}")
    public ResponseEntity<Map<String, Object>> getSessionDetail(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("id") Long sessionId
    ) {
        Long memberId = currentMemberId(jwt);
        return ResponseEntity.ok(recipeService.getSessionDetail(memberId, sessionId));
    }
}
