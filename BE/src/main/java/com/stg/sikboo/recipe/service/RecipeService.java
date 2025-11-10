package com.stg.sikboo.recipe.service;

import com.stg.sikboo.recipe.domain.Recipe;
import com.stg.sikboo.recipe.domain.repository.RecipeRepository;
import com.stg.sikboo.recipe.dto.request.RecipeGenerateRequest;
import com.stg.sikboo.recipe.dto.response.RecipeSuggestionResponse;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final NamedParameterJdbcTemplate jdbc;

    public RecipeService(RecipeRepository recipeRepository, NamedParameterJdbcTemplate jdbc) {
        this.recipeRepository = recipeRepository;
        this.jdbc = jdbc;
    }

    // ---------- 임시 LLM 대체용 레시피 카탈로그 ----------
    private record Catalog(String title, List<String> main, List<String> seasoning, String content) {}
    private static final List<Catalog> CATALOG = List.of(
            new Catalog("비빔국수의 핵심은 양념장!", List.of("소면", "오이", "당근", "계란"),
                    List.of("고추장", "간장", "참기름", "설탕"),
                    "소면을 삶아 찬물에 헹구고 채소와 계란을 함께 비빈다."),
            new Catalog("감자볶음", List.of("감자", "양파"),
                    List.of("소금", "후추", "식용유"),
                    "감자를 채썰어 양파와 함께 볶는다."),
            new Catalog("오이무침", List.of("오이"),
                    List.of("고춧가루", "식초", "설탕", "참기름"),
                    "오이를 어슷썰어 양념과 함께 무친다.")
    );

    // ---------- 내 재료 목록 (생성 탭) ----------
    // 프론트 기대 형태: [{ id, name }]
    public List<Map<String, Object>> findMyIngredients(Long memberId) {
        String sql = """
            SELECT ingredient_id AS id, ingredient_name AS name
            FROM ingredient
            WHERE member_id = :memberId
            ORDER BY ingredient_id DESC
        """;
        return jdbc.query(sql, Map.of("memberId", memberId), (rs, i) -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", rs.getLong("id"));
            m.put("name", rs.getString("name"));
            return m;
        });
    }

    // ---------- 선택한 재료 이름 조회 ----------
    private Set<String> getIngredientNames(Long memberId, List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Set.of();

        String sql = """
            SELECT ingredient_name
            FROM ingredient
            WHERE member_id = :memberId AND ingredient_id IN (:ids)
        """;

        Map<String, Object> params = new HashMap<>();
        params.put("memberId", memberId);
        params.put("ids", ids);

        List<String> names = jdbc.query(sql, params, (rs, i) -> rs.getString("ingredient_name"));
        return names.stream().map(String::trim).collect(Collectors.toSet());
    }

    // ---------- 레시피 생성 ----------
    public List<RecipeSuggestionResponse> generateRecipes(RecipeGenerateRequest req) {
        Long memberId = req.memberId(); // 컨트롤러에서 JWT로 강제 세팅됨
        Set<String> selectedNames = getIngredientNames(memberId, req.ingredientIds());
        List<RecipeSuggestionResponse> result = new ArrayList<>();

        for (Catalog c : CATALOG) {
            long match = c.main.stream().filter(selectedNames::contains).count();
            if (match >= 1) {
                List<String> missing = c.main.stream()
                        .filter(m -> !selectedNames.contains(m)).toList();

                result.add(new RecipeSuggestionResponse(
                        Math.abs(c.title.hashCode() * 1L),
                        c.title, c.main, c.seasoning, missing, c.content
                ));
            }
        }

        if (result.isEmpty()) {
            result.add(new RecipeSuggestionResponse(
                    999L,
                    "선택한 재료로 간단한 볶음",
                    new ArrayList<>(selectedNames),
                    List.of("소금", "후추", "식용유"),
                    List.of(),
                    "재료를 썰어 센 불에서 볶는다."
            ));
        }

        // (선택) 생성 결과 저장
        for (RecipeSuggestionResponse r : result) {
            Recipe entity = new Recipe();
            entity.setMemberId(memberId);
            entity.setName(r.title());
            entity.setDetail(r.content());
            recipeRepository.save(entity);
        }

        return result;
    }

    // ---------- 목록 조회 ----------
    public List<RecipeSuggestionResponse> getRecipeList(Long memberId) {
        return recipeRepository.findByMemberId(memberId).stream()
                .map(r -> new RecipeSuggestionResponse(
                        r.getId(),
                        r.getName(),
                        List.of(),  // main/seasoning/missing은 LLM 연동 후 채움
                        List.of(),
                        List.of(),
                        r.getDetail()
                ))
                .toList();
    }

    public void recommendMore(Long memberId) {
        // TODO: LLM 붙이면서 확장
    }
}
