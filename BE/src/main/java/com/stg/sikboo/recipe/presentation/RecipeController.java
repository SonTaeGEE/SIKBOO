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
@CrossOrigin(
        origins = { "http://localhost:5173", "http://127.0.0.1:5173" },
        allowCredentials = "true",
        maxAge = 3600
)
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

    // 프론트: POST /api/recipes/sessions/{id}/recommend-more (filter=have|need)
    @PostMapping("/recipes/sessions/{id}/recommend-more")
    public ResponseEntity<Void> recommendMoreForSession(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("id") Long sessionId,
            @RequestParam(name = "filter", required = false) String filter
    ) {
        Long memberId = currentMemberId(jwt);
        log.info("[POST] /recipes/sessions/{}/recommend-more memberId={} filter={}", sessionId, memberId, filter);
        recipeService.recommendMore(memberId, sessionId, filter); // ★ sessionId 전달
        return ResponseEntity.ok().build();
    }

    // 하위 호환
    @PostMapping("/recipes/recommend-more")
    public ResponseEntity<Void> recommendMore(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "filter", required = false) String filter
    ) {
        Long memberId = currentMemberId(jwt);
        log.info("[POST] /recipes/recommend-more memberId={} filter={}", memberId, filter);
        // 세션 ID 없이 호출되는 구버전은 갱신 대상 세션을 알 수 없으므로 미지원
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
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
}
