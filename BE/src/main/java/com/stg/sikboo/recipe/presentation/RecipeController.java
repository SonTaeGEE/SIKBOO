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
        // 1) custom claim: memberId
        Object mid = jwt.getClaim("memberId");
        if (mid instanceof Integer i) return i.longValue();
        if (mid instanceof Long l) return l;
        if (mid instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException ignored) {}
        }
        // 2) fallback: sub를 숫자로 사용 (프로젝트 구성에 따라 다름)
        try { return Long.parseLong(jwt.getSubject()); } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "JWT에 memberId가 없습니다.");
        }
    }

    /** [생성 탭] 내 재료 목록 */
    @GetMapping("/ingredients/my")
    public ResponseEntity<List<Map<String, Object>>> myIngredients(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long memberId = currentMemberId(jwt);
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
        return ResponseEntity.ok(recipeService.getRecipeList(memberId)); // 필터/검색은 추후 확장
    }

    /** [생성 버튼] 레시피 생성 */
    @PostMapping("/recipes/generate")
    public ResponseEntity<Void> generate(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody RecipeGenerateRequest req
    ) {
        Long memberId = currentMemberId(jwt);
        // body에 memberId가 오든 말든, 인증 주체 기준으로 강제
        RecipeGenerateRequest fixed = new RecipeGenerateRequest(memberId, req.ingredientIds());
        recipeService.generateRecipes(fixed);
        return ResponseEntity.ok().build();
    }

    /** [다른 레시피 추천받기!] */
    @PostMapping("/recipes/recommend-more")
    public ResponseEntity<Void> recommendMore(@AuthenticationPrincipal Jwt jwt) {
        Long memberId = currentMemberId(jwt);
        recipeService.recommendMore(memberId);
        return ResponseEntity.ok().build();
    }
}
