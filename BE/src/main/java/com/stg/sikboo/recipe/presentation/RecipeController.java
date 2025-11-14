package com.stg.sikboo.recipe.presentation;

import com.stg.sikboo.recipe.dto.request.RecipeGenerateRequest;
import com.stg.sikboo.recipe.dto.response.RecipeSuggestionResponse;
import com.stg.sikboo.recipe.service.RecipeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
public class RecipeController {

    private final RecipeService recipeService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    /** JWT에서 memberId 추출 */
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
        log.info("[GET] /ingredients/my memberId={}", memberId);
        return ResponseEntity.ok(recipeService.findMyIngredients(memberId));
    }

    /** [목록 탭] 레시피 조회 */
    @GetMapping("/recipes")
    public ResponseEntity<List<RecipeSuggestionResponse>> listRecipes(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "filter", required = false) String filter,
            @RequestParam(name = "q", required = false) String q
    ) {
        Long memberId = currentMemberId(jwt);
        log.info("[GET] /recipes memberId={} filter={} q={}", memberId, filter, q);
        return ResponseEntity.ok(recipeService.listRecipes(memberId, filter, q));
    }

    /** [생성 버튼] 레시피 생성 */
    @PostMapping(
            path = "/recipes/generate",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Map<String, Object>> generate(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody RecipeGenerateRequest req
    ) {
        Long memberId = currentMemberId(jwt);
        log.info("[POST] /recipes/generate memberId={} ingredientIds={}", memberId, req.ingredientIds());

        Map<String, Object> created = recipeService.generateRecipes(
                new RecipeGenerateRequest(memberId, req.ingredientIds())
        );
        log.info(" -> Created session: {}", created);
        return ResponseEntity.ok(created);
    }

    // 잘못된 GET을 SPA로 돌려보내기
    @GetMapping("/recipes/generate")
    public ResponseEntity<Void> guardGenerateGet() {
        log.warn("[GET] /recipes/generate 잘못된 GET 호출 감지 -> {} 로 303 리다이렉트", frontendUrl + "/recipes");
        return ResponseEntity.status(HttpStatus.SEE_OTHER)
                .location(URI.create(frontendUrl + "/recipes"))
                .build();
    }

    /** [방 목록] */
    @GetMapping("/recipes/sessions")
    public ResponseEntity<List<Map<String, Object>>> listSessions(@AuthenticationPrincipal Jwt jwt) {
        Long memberId = currentMemberId(jwt);
        log.info("[GET] /recipes/sessions memberId={}", memberId);
        return ResponseEntity.ok(recipeService.listSessions(memberId));
    }

    /** [방 상세] */
    @GetMapping("/recipes/sessions/{id}")
    public ResponseEntity<Map<String, Object>> getSessionDetail(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("id") Long sessionId
    ) {
        Long memberId = currentMemberId(jwt);
        log.info("[GET] /recipes/sessions/{} memberId={}", sessionId, memberId);
        return ResponseEntity.ok(recipeService.getSessionDetail(memberId, sessionId));
    }

    /** [방 제목 수정] */
    @PatchMapping("/recipes/sessions/{id}")
    public ResponseEntity<Map<String, Object>> updateSessionTitle(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("id") Long sessionId,
            @RequestBody Map<String, String> body
    ) {
        Long memberId = currentMemberId(jwt);
        String title = body.getOrDefault("title", "").trim();
        log.info("[PATCH] /recipes/sessions/{} memberId={} title={}", sessionId, memberId, title);
        Map<String, Object> updated = recipeService.updateSessionTitle(memberId, sessionId, title);
        return ResponseEntity.ok(updated);
    }

    /** [방 삭제] */
    @DeleteMapping("/recipes/sessions/{id}")
    public ResponseEntity<Void> deleteSession(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("id") Long sessionId
    ) {
        Long memberId = currentMemberId(jwt);
        log.info("[DELETE] /recipes/sessions/{} memberId={}", sessionId, memberId);
        recipeService.deleteSession(memberId, sessionId);
        return ResponseEntity.noContent().build();
    }

    /** [방 순서 재정렬] */
    @PatchMapping("/recipes/sessions/reorder")
    public ResponseEntity<Void> reorderSessions(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, List<Long>> body
    ) {
        Long memberId = currentMemberId(jwt);
        List<Long> orderedIds = body.get("orderedIds");
        log.info("[PATCH] /recipes/sessions/reorder memberId={} orderedIds={}", memberId, orderedIds);
        recipeService.reorderSessions(memberId, orderedIds);
        return ResponseEntity.ok().build();
    }
}
