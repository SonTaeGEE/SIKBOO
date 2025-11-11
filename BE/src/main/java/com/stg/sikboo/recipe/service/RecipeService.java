package com.stg.sikboo.recipe.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stg.sikboo.recipe.domain.Recipe;
import com.stg.sikboo.recipe.domain.repository.RecipeRepository;
import com.stg.sikboo.recipe.dto.request.RecipeGenerateRequest;
import com.stg.sikboo.recipe.dto.response.RecipeSuggestionResponse;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final NamedParameterJdbcTemplate jdbc;
    private final ChatClient chat; // Spring AI
    private final ObjectMapper mapper = new ObjectMapper();

    public RecipeService(
            RecipeRepository recipeRepository,
            NamedParameterJdbcTemplate jdbc,
            ChatClient chatClient
    ) {
        this.recipeRepository = recipeRepository;
        this.jdbc = jdbc;
        this.chat = chatClient;
    }

    // ---------------- In-memory 캐시(현재 UI용) ----------------
    private final Map<Long, Set<String>> lastSelectedByMember = new ConcurrentHashMap<>();
    private final Map<Long, AiResponse> lastAiResponse = new ConcurrentHashMap<>();
    private final Map<Long, Set<String>> generatedTitlesHave = new ConcurrentHashMap<>();
    private final Map<Long, Set<String>> generatedTitlesNeed = new ConcurrentHashMap<>();

    // ---------- 내 재료 목록 조회 ----------
    public List<Map<String, Object>> findMyIngredients(Long memberId) {
        String sql = """
                SELECT
                    ingredient_id AS id,
                    ingredient_name AS name
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

    // ---------- 선택 재료의 이름 조회 ----------
    private Set<String> getIngredientNames(Long memberId, List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Set.of();

        String sql = """
                SELECT ingredient_name
                FROM ingredient
                WHERE member_id = :memberId
                  AND ingredient_id IN (:ids)
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("memberId", memberId);
        params.put("ids", ids);

        List<String> names = jdbc.query(sql, params, (rs, i) -> rs.getString("ingredient_name"));
        return names.stream().map(String::trim).collect(Collectors.toSet());
    }

    // ---------- 레시피 생성(캐시 + 세션 저장) ----------
    @Transactional
    public Map<String, Object> generateRecipes(RecipeGenerateRequest req) {
        Long memberId = (req.memberId() != null) ? req.memberId() : 1L;

        Set<String> selectedNames = getIngredientNames(memberId, req.ingredientIds());
        lastSelectedByMember.put(memberId, selectedNames);
        generatedTitlesHave.put(memberId, new HashSet<>());
        generatedTitlesNeed.put(memberId, new HashSet<>());

        AiResponse ai = callAi(memberId, selectedNames, Set.of(), Set.of());
        lastAiResponse.put(memberId, ai);

        String haveTitle = ai.have.isEmpty() ? null : ai.have.get(0).title;
        String needTitle = ai.need.isEmpty() ? null : ai.need.get(0).title;

        String sessionTitle;
        if (haveTitle != null && needTitle != null) {
            sessionTitle = haveTitle + " · " + needTitle;
        } else if (haveTitle != null) {
            sessionTitle = haveTitle;
        } else if (needTitle != null) {
            sessionTitle = needTitle;
        } else {
            sessionTitle = "AI 레시피 제안";
        }

        String payload;
        try {
            payload = mapper.writeValueAsString(ai);
        } catch (Exception e) {
            payload = "{\"have\":[],\"need\":[]}";
        }

        Recipe e = new Recipe();
        e.setMemberId(memberId);
        e.setName(sessionTitle);
        e.setDetail(payload);
        recipeRepository.save(e);

        Map<String, Object> ret = new HashMap<>();
        ret.put("id", e.getId());
        ret.put("title", e.getName());
        return ret;
    }

    // ---------- 목록 조회 ----------
    public List<RecipeSuggestionResponse> listRecipes(Long memberId, String filter, String q) {
        AiResponse ai = lastAiResponse.get(memberId);
        if (ai == null) return List.of();

        List<AiRecipe> base = "need".equalsIgnoreCase(filter) ? ai.need : ai.have;

        if (q != null && !q.isBlank()) {
            String keyword = q.toLowerCase();
            base = base.stream()
                    .filter(r -> r.title != null && r.title.toLowerCase().contains(keyword))
                    .toList();
        }

        return base.stream().map(this::toSuggestion).toList();
    }

    // ---------- 다른 레시피 추천 ----------
    public void recommendMore(Long memberId, String filter) {
        Set<String> selected = lastSelectedByMember.get(memberId);
        if (selected == null || selected.isEmpty()) return;

        Set<String> avoidHave = generatedTitlesHave.computeIfAbsent(memberId, k -> new HashSet<>());
        Set<String> avoidNeed = generatedTitlesNeed.computeIfAbsent(memberId, k -> new HashSet<>());

        AiResponse aiNew = callAi(memberId, selected, avoidHave, avoidNeed);
        AiResponse current = lastAiResponse.getOrDefault(memberId, new AiResponse());

        if (filter == null || "have".equalsIgnoreCase(filter)) current.have.addAll(aiNew.have);
        if (filter == null || "need".equalsIgnoreCase(filter)) current.need.addAll(aiNew.need);

        lastAiResponse.put(memberId, current);

        avoidHave.addAll(
                aiNew.have.stream().map(r -> r.title).filter(Objects::nonNull).toList()
        );
        avoidNeed.addAll(
                aiNew.need.stream().map(r -> r.title).filter(Objects::nonNull).toList()
        );
    }

    // ---------- Spring AI 호출 ----------
    private AiResponse callAi(Long memberId, Set<String> haveNow, Set<String> avoidHave, Set<String> avoidNeed) {
        try {
            String prompt = buildPrompt(haveNow, avoidHave, avoidNeed);
            String json = chat.prompt().user(prompt).call().content();
            AiResponse res = mapper.readValue(json, AiResponse.class).sanitize();

            generatedTitlesHave
                    .computeIfAbsent(memberId, k -> new HashSet<>())
                    .addAll(res.have.stream().map(r -> r.title).filter(Objects::nonNull).toList());

            generatedTitlesNeed
                    .computeIfAbsent(memberId, k -> new HashSet<>())
                    .addAll(res.need.stream().map(r -> r.title).filter(Objects::nonNull).toList());

            return res;
        } catch (Exception e) {
            return fallbackFrom(haveNow);
        }
    }

    private String buildPrompt(Set<String> haveNow, Set<String> avoidHave, Set<String> avoidNeed) {
        return """
                당신은 요리 레시피 어시스턴트입니다. 반드시 아래 JSON 스키마로만 응답하세요.

                사용자 보유 재료(haveNow): %s

                아래 제목과 겹치지 않도록 새로운 레시피만 제안하세요.
                - 이미 제안된 have 레시피 제목: %s
                - 이미 제안된 need 레시피 제목: %s

                출력 형식(JSON):
                {
                  "have": [
                    {
                      "title": "제목",
                      "ingredients": {
                        "have": ["보유 재료 중 사용한 것들"],
                        "need": [],
                        "seasoning": ["기본 양념 또는 소스"]
                      },
                      "steps": ["1단계", "2단계", "3단계 ..."]
                    },
                    { ... 총 3개 }
                  ],
                  "need": [
                    {
                      "title": "제목",
                      "ingredients": {
                        "have": ["보유 재료 중 사용한 것들"],
                        "need": ["추가로 필요한 재료 1~3개"],
                        "seasoning": ["기본 양념 또는 소스"]
                      },
                      "steps": ["1단계", "2단계", "3단계 ..."]
                    },
                    { ... 총 3개 }
                  ]
                }

                조건:
                - have 목록은 반드시 보유 재료만 사용해서 가능한 레시피 3개를 주세요.
                - need 목록은 보유 재료를 베이스로 "추가 재료"를 1~3개 정도만 더해 만들 수 있는 레시피 3개를 주세요.
                - 각 레시피는 한국어로 간결하고 실용적인 단계 설명(steps)을 포함해야 합니다.
                - 같은 제목을 절대로 중복하지 마세요(avoid 제목 포함).
                - JSON 외의 설명, 마크다운, 코멘트는 출력하지 마세요.
                """.formatted(
                String.join(", ", haveNow),
                avoidHave.isEmpty() ? "없음" : String.join(", ", avoidHave),
                avoidNeed.isEmpty() ? "없음" : String.join(", ", avoidNeed)
        );
    }

    private AiResponse fallbackFrom(Set<String> haveNow) {
        List<String> hv = new ArrayList<>(haveNow);
        String hv1 = hv.isEmpty() ? "계란" : hv.get(0);
        String hv2 = hv.size() > 1 ? hv.get(1) : "밥";
        String hv3 = hv.size() > 2 ? hv.get(2) : "김치";

        AiRecipe a = new AiRecipe(
                "간단 " + hv1 + " 볶음",
                List.of(hv1),
                List.of(),
                List.of("소금", "후추", "식용유"),
                List.of("재료 손질", "센 불에 빠르게 볶기", "간 맞추기")
        );

        AiRecipe b = new AiRecipe(
                hv2 + " 주먹밥",
                List.of(hv2),
                List.of(),
                List.of("소금", "참기름", "김가루"),
                List.of("밥에 양념 섞기", "동그랗게 쥐기", "마무리")
        );

        AiRecipe c = new AiRecipe(
                hv3 + " 무침",
                List.of(hv3),
                List.of(),
                List.of("고춧가루", "식초", "설탕"),
                List.of("재료 썰기", "양념 버무리기", "접시에 담기")
        );

        AiRecipe d = new AiRecipe(
                hv1 + " 덮밥",
                List.of(hv1),
                List.of("양파"),
                List.of("간장", "설탕", "참기름"),
                List.of("양파 볶기", hv1 + " 넣고 볶기", "밥 위에 올리기")
        );

        AiRecipe e = new AiRecipe(
                hv2 + " 전",
                List.of(hv2),
                List.of("부침가루", "파"),
                List.of("소금", "식용유"),
                List.of("반죽 만들기", "앞뒤로 부치기", "완성")
        );

        AiRecipe f = new AiRecipe(
                hv3 + " 찌개",
                List.of(hv3),
                List.of("두부"),
                List.of("고춧가루", "다시마육수"),
                List.of("육수 끓이기", hv3 + " 넣기", "간 맞춰 마무리")
        );

        AiResponse res = new AiResponse();
        res.have = new ArrayList<>(List.of(a, b, c));
        res.need = new ArrayList<>(List.of(d, e, f));
        return res;
    }

    /** ←← 여기만 변경: id를 Long으로 생성해서 DTO에 맞춘다 */
    private RecipeSuggestionResponse toSuggestion(AiRecipe r) {
        List<String> main = new ArrayList<>();
        if (r.ingredients != null) {
            if (r.ingredients.have != null) main.addAll(r.ingredients.have);
            if (r.ingredients.need != null) main.addAll(r.ingredients.need);
        }

        List<String> seasoning = (r.ingredients != null && r.ingredients.seasoning != null)
                ? r.ingredients.seasoning
                : List.of();

        List<String> missing = (r.ingredients != null && r.ingredients.need != null)
                ? r.ingredients.need
                : List.of();

        String content = (r.steps == null || r.steps.isEmpty())
                ? ""
                : String.join("\n", r.steps);

        // int → Long 변환 (음수 방지 위해 unsigned long 사용)
        long hash = Integer.toUnsignedLong(
                Objects.hash(
                        Optional.ofNullable(r.title).orElse(""),
                        main.toString(),
                        content
                )
        );

        return new RecipeSuggestionResponse(
                hash,               // Long id
                r.title,
                main,               // mainIngredients
                seasoning,          // seasoningIngredients
                missing,            // missing
                content             // content
        );
    }

    // =========================
    // 세션(방) 목록/상세
    // =========================
    public List<Map<String, Object>> listSessions(Long memberId) {
        var list = recipeRepository.findByMemberId(memberId);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        return list.stream()
                .sorted(Comparator.comparing(Recipe::getCreatedAt).reversed())
                .map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("title", r.getName());
                    m.put("createdAt", r.getCreatedAt() == null ? null : fmt.format(r.getCreatedAt()));
                    return m;
                })
                .toList();
    }

    public Map<String, Object> getSessionDetail(Long memberId, Long id) {
        Recipe e = recipeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 세션"));

        if (!Objects.equals(e.getMemberId(), memberId)) {
            throw new IllegalArgumentException("본인 세션만 조회할 수 있습니다.");
        }

        AiResponse ai;
        try {
            ai = mapper.readValue(e.getDetail(), AiResponse.class).sanitize();
        } catch (Exception ex) {
            ai = new AiResponse();
        }

        Map<String, Object> ret = new HashMap<>();
        ret.put("id", e.getId());
        ret.put("title", e.getName());
        ret.put("have", ai.have.stream().map(this::toSuggestion).toList());
        ret.put("need", ai.need.stream().map(this::toSuggestion).toList());
        return ret;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AiResponse {
        public List<AiRecipe> have = new ArrayList<>();
        public List<AiRecipe> need = new ArrayList<>();

        AiResponse sanitize() {
            if (have == null) have = new ArrayList<>();
            if (need == null) need = new ArrayList<>();

            have.forEach(r -> {
                if (r.title == null) r.title = "이름 없는 레시피";
            });
            need.forEach(r -> {
                if (r.title == null) r.title = "이름 없는 레시피";
            });

            return this;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AiRecipe {
        public String title;
        public Ingredients ingredients = new Ingredients();
        public List<String> steps = new ArrayList<>();

        public AiRecipe() {}

        public AiRecipe(
                String title,
                List<String> have,
                List<String> need,
                List<String> seasoning,
                List<String> steps
        ) {
            this.title = title;
            this.ingredients = new Ingredients();
            this.ingredients.have = have != null ? have : new ArrayList<>();
            this.ingredients.need = need != null ? need : new ArrayList<>();
            this.ingredients.seasoning = seasoning != null ? seasoning : new ArrayList<>();
            this.steps = steps != null ? steps : new ArrayList<>();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Ingredients {
        public List<String> have = new ArrayList<>();
        public List<String> need = new ArrayList<>();
        public List<String> seasoning = new ArrayList<>();
    }
}
