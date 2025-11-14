package com.stg.sikboo.recipe.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stg.sikboo.ingredient.domain.Ingredient;
import com.stg.sikboo.ingredient.domain.IngredientRepository;
import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.member.domain.MemberRepository;
import com.stg.sikboo.recipe.domain.Recipe;
import com.stg.sikboo.recipe.domain.repository.RecipeRepository;
import com.stg.sikboo.recipe.dto.request.RecipeGenerateRequest;
import com.stg.sikboo.recipe.dto.response.RecipeSuggestionResponse;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;
import java.util.Arrays;

@Slf4j
@Service
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final MemberRepository memberRepository;
    private final ChatClient chat; // Spring AI
    private final ObjectMapper mapper;

    public RecipeService(
            RecipeRepository recipeRepository,
            IngredientRepository ingredientRepository,
            MemberRepository memberRepository,
            ChatClient chatClient
    ) {
        this.recipeRepository = recipeRepository;
        this.ingredientRepository = ingredientRepository;
        this.memberRepository = memberRepository;
        this.chat = chatClient;
        this.mapper = new ObjectMapper()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    // ---------------- In-memory 캐시(현재 UI용) ----------------
    private final Map<Long, Set<String>> lastSelectedByMember = new ConcurrentHashMap<>();
    private final Map<Long, AiResponse> lastAiResponse = new ConcurrentHashMap<>();
    private final Map<Long, Set<String>> generatedTitlesHave = new ConcurrentHashMap<>();
    private final Map<Long, Set<String>> generatedTitlesNeed = new ConcurrentHashMap<>();

    // ★ 세션 단위 생성중 상태(탭 이동/재진입에도 유지, 서버 살아있는 동안)
    private final Set<Long> generatingSessions = ConcurrentHashMap.newKeySet();

    // ★ 백그라운드 생성용 스레드 풀(가볍게 2개)
    private final ExecutorService aiExecutor = Executors.newFixedThreadPool(2);

    @PreDestroy
    public void shutdown() {
        aiExecutor.shutdownNow();
    }

    // 기본 재료(need에 절대 들어가면 안 되는 키워드)
    private static final Set<String> BASIC_ALWAYS_HAVE = Set.of(
            "밥", "흰쌀밥", "쌀", "백미", "물", "정수"
    );

    // ---------- 내 재료 목록 조회 (JPA) ----------
    public List<Map<String, Object>> findMyIngredients(Long memberId) {
        // IngredientRepository:
        // List<Ingredient> findByMemberIdOrderByIdDesc(Long memberId);

        List<Ingredient> ingredients =
                ingredientRepository.findByMemberIdOrderByIdDesc(memberId);

        return ingredients.stream()
                .map(i -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", i.getId());
                    m.put("name", i.getIngredientName());
                    return m;
                })
                .toList();
    }

    // ---------- 선택 재료의 이름 조회 (JPA) ----------
    private Set<String> getIngredientNames(Long memberId, List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Set.of();

        // IngredientRepository:
        // List<Ingredient> findByMemberIdAndIdIn(Long memberId, List<Long> ids);
        List<Ingredient> ingredients =
                ingredientRepository.findByMemberIdAndIdIn(memberId, ids);

        return ingredients.stream()
                .map(Ingredient::getIngredientName)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
    }

    // ---------- 배열(String[]) → Set<String> 유틸 ----------
    private Set<String> arrayToCleanSet(String[] arr) {
        if (arr == null || arr.length == 0) return Set.of();

        return Arrays.stream(arr)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
    }

    // ---------- 회원 질병/알레르기 조회 (JPA) ----------
    private Health getMemberHealth(Long memberId) {
        try {
            Optional<Member> optional = memberRepository.findById(memberId);
            if (optional.isEmpty()) {
                log.info("[HEALTH] memberId={} 건강정보 없음", memberId);
                return new Health(Set.of(), Set.of());
            }

            Member member = optional.get();

            // Member 엔티티: String[] diseases, String[] allergies 를 사용
            Set<String> diseases = arrayToCleanSet(member.getDiseases());
            Set<String> allergies = arrayToCleanSet(member.getAllergies());

            return new Health(diseases, allergies);
        } catch (Exception e) {
            log.info("[HEALTH] memberId={} 건강정보 조회 실패: {}", memberId, e.toString());
            return new Health(Set.of(), Set.of());
        }
    }

    // ---------- 레시피 생성(즉시 방 생성 → 비동기 AI) ----------
    // 트랜잭션을 붙이지 않고, 각각의 repository 호출에서 자체 트랜잭션을 사용
    public Map<String, Object> generateRecipes(RecipeGenerateRequest req) {
        Long memberId = (req.memberId() != null) ? req.memberId() : 1L;

        // 선택된 재료 & 건강정보
        Set<String> selectedNames = getIngredientNames(memberId, req.ingredientIds());
        Health health = getMemberHealth(memberId);

        lastSelectedByMember.put(memberId, selectedNames);
        generatedTitlesHave.put(memberId, new HashSet<>());
        generatedTitlesNeed.put(memberId, new HashSet<>());

        // 1) 우선 "레시피 생성중…" 제목과 빈 페이로드로 방 생성 후 즉시 응답
        Recipe session = new Recipe();
        session.setMemberId(memberId);
        session.setName("레시피 생성중…");
        session.setDetail(emptyPayloadJson());

        // ★ 현재 회원의 마지막 display_order + 1 로 설정
        Long maxOrder = recipeRepository.findMaxDisplayOrderByMemberId(memberId);
        if (maxOrder == null) {
            maxOrder = 0L;
        }
        session.setDisplayOrder(maxOrder + 1);

        recipeRepository.save(session);

        Long sessionId = session.getId();
        generatingSessions.add(sessionId);

        log.info("[GENERATE] sessionId={} memberId={} haveNow={}", sessionId, memberId, selectedNames);

        // 2) 백그라운드에서 AI 생성 → 세션 갱신
        aiExecutor.submit(() -> {
            try {
                log.info("[AI-ASYNC] 시작 memberId={} sessionId={}", memberId, sessionId);
                AiResponse ai = callAi(memberId, selectedNames, Set.of(), Set.of(), health);
                lastAiResponse.put(memberId, ai);

                // 제목 결정
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
                    // 레시피가 하나도 없으면 실패 안내
                    sessionTitle = "레시피 생성에 실패했습니다";
                }

                String payload;
                try {
                    payload = mapper.writeValueAsString(ai);
                } catch (Exception e) {
                    log.warn("[AI] serialize 실패: {}", e.toString());
                    payload = emptyPayloadJson();
                }

                // DB 업데이트 (JPA - 각 호출은 자체 트랜잭션)
                Recipe s = recipeRepository.findById(sessionId).orElseThrow();
                s.setName(sessionTitle);
                s.setDetail(payload);
                recipeRepository.save(s);
                log.info("[AI-ASYNC] 완료 sessionId={} title={}", s.getId(), sessionTitle);
            } catch (Exception ex) {
                log.warn("[AI-ASYNC] 실패 sessionId={} : {}", sessionId, ex.toString());
                // 실패 시에도 세션 이름만 변경해서 사용자에게 알려줌
                try {
                    Recipe s = recipeRepository.findById(sessionId).orElseThrow();
                    s.setName("레시피 생성에 실패했습니다");
                    s.setDetail(emptyPayloadJson());
                    recipeRepository.save(s);
                } catch (Exception e2) {
                    log.warn("[AI-ASYNC] 실패 세션 업데이트도 실패 sessionId={} : {}", sessionId, e2.toString());
                }
            } finally {
                generatingSessions.remove(sessionId);
            }
        });

        Map<String, Object> ret = new HashMap<>();
        ret.put("id", sessionId);
        ret.put("title", session.getName()); // "레시피 생성중…"
        return ret;
    }

    private String emptyPayloadJson() {
        return "{\"notice\":\"\",\"have\":[],\"need\":[]}";
    }

    // ---------- 목록 조회 (현재는 AI 메모리 기준 API — 필요 시 사용) ----------
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

    // ---------- Spring AI 호출 ----------
    private AiResponse callAi(Long memberId,
                              Set<String> haveNow,
                              Set<String> avoidHave,
                              Set<String> avoidNeed,
                              Health health) {
        try {
            String prompt = buildPrompt(haveNow, avoidHave, avoidNeed, health);

            String raw = chat.prompt()
                    .system("""
                            당신은 레시피 생성기입니다.
                            반드시 **JSON만** 반환하세요. 마크다운/설명/코드펜스 금지.
                            JSON 이외의 문자는 출력하지 마세요.
                            """)
                    .user(prompt)
                    .call()
                    .content();

            String json = extractJson(raw);
            if (json == null || json.isBlank()) {
                log.warn("[AI] JSON 추출 실패. raw={}", raw);
                AiResponse fail = new AiResponse();
                fail.notice = "AI 응답을 해석하지 못해 레시피를 생성하지 못했습니다.";
                return fail.sanitize();
            }

            AiResponse res = mapper.readValue(json, AiResponse.class).sanitize();

            // 서버측 정규화 + 기본 재료 need 금지 강제
            for (AiRecipe r : res.have) {
                if (r.ingredients == null) r.ingredients = new Ingredients();
                r.ingredients.have = normalize(r.ingredients.have);
                r.ingredients.need = new ArrayList<>();
                r.ingredients.seasoning = normalize(r.ingredients.seasoning);
            }
            for (AiRecipe r : res.need) {
                if (r.ingredients == null) r.ingredients = new Ingredients();
                List<String> usedHave = normalize(r.ingredients.have);
                List<String> needs = normalize(r.ingredients.need);

                // 기본 재료(밥/물 등)는 need에서 제거
                needs.removeIf(this::isBasicAlwaysHave);

                // 보유/이미 사용한 것과 겹치지 않도록
                needs.removeIf(haveNow::contains);
                needs.removeIf(usedHave::contains);

                r.ingredients.have = usedHave;
                r.ingredients.need = needs;
                r.ingredients.seasoning = normalize(r.ingredients.seasoning);
            }

            generatedTitlesHave
                    .computeIfAbsent(memberId, k -> new HashSet<>())
                    .addAll(res.have.stream().map(r -> r.title).filter(Objects::nonNull).toList());

            generatedTitlesNeed
                    .computeIfAbsent(memberId, k -> new HashSet<>())
                    .addAll(res.need.stream().map(r -> r.title).filter(Objects::nonNull).toList());

            return res;
        } catch (Exception e) {
            log.warn("[AI] call/parse 실패: {}", e.toString());
            AiResponse fail = new AiResponse();
            fail.notice = "AI 호출 중 오류가 발생해 레시피를 생성하지 못했습니다.";
            return fail.sanitize();
        }
    }

    /** 모델이 코드펜스/설명 섞어 보낼 때를 대비해 JSON만 뽑아낸다 */
    private static String extractJson(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        if (s.startsWith("```")) {
            int first = s.indexOf('{');
            int last = s.lastIndexOf('}');
            if (first >= 0 && last > first) return s.substring(first, last + 1).trim();
        }
        int first = s.indexOf('{');
        int last = s.lastIndexOf('}');
        if (first >= 0 && last > first) return s.substring(first, last + 1).trim();
        if (s.startsWith("\"") && s.endsWith("\"")) {
            String unq = s.substring(1, s.length() - 1)
                    .replace("\\n", "\n")
                    .replace("\\t", "\t")
                    .replace("\\\"", "\"");
            int f = unq.indexOf('{');
            int l = unq.lastIndexOf('}');
            if (f >= 0 && l > f) return unq.substring(f, l + 1).trim();
        }
        return null;
    }

    /** 가변 리스트 보장 */
    private static List<String> normalize(List<String> src) {
        if (src == null) return new ArrayList<>();
        List<String> cleaned = src.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .collect(Collectors.toList());
        return new ArrayList<>(cleaned);
    }

    // 기본 재료(need 금지) 판별
    private boolean isBasicAlwaysHave(String s) {
        if (s == null) return false;
        String t = s.replace(" ", "").trim();
        for (String key : BASIC_ALWAYS_HAVE) {
            if (t.contains(key)) return true; // '정수물', '흰쌀밥' 등 포함 대응
        }
        return false;
    }

    /** 프롬프트 — 다양성 강화 & 기본재료/제목 편중 방지 */
    private String buildPrompt(Set<String> haveNow,
                               Set<String> avoidHave,
                               Set<String> avoidNeed,
                               Health health) {
        String diseasesStr  = health.diseases.isEmpty()  ? "없음" : String.join(", ", health.diseases);
        String allergiesStr = health.allergies.isEmpty() ? "없음" : String.join(", ", health.allergies);

        return """
                당신은 **세계 각국의 가정식/일상 요리 전반**을 잘 아는 레시피 어시스턴트입니다.
                **반드시 JSON만** 출력하고, 그 외 텍스트/설명/마크다운은 금지합니다.

                [사용자 보유 재료(haveNow)]
                %s

                [사용자 건강 정보]
                - 지병(diseases): %s
                - 알레르기(allergies): %s
                - 위 정보가 '없음'이면 건강 제한을 적용하지 않습니다. 값이 있으면 해당 식재료·소스·조리법을 배제하고 안전한 대안을 제시하세요.

                [금지 규칙(매우 중요)]
                - 건강 정보와 **직접/간접적으로 연관된** 모든 재료/소스/토핑/조리법은 **전부 제외**합니다.
                - 판단이 불확실하면 **보수적으로 제외**합니다.
                - 금지 재료는 ingredients.have/need/seasoning 어디에도 넣지 않습니다.

                [가정(항상 보유)]
                - 밥(흰쌀밥), 물
                - 기본 재료(= 흔히 갖춘 베이스): 소금, 설탕, 간장, 식용유, 참기름, 후추, 고춧가루, 다진마늘, 밀가루(또는 전분)
                  → 이 항목들은 need에 넣지 말고 **ingredients.seasoning = '기본 재료'** 목록에만 기입합니다.
                  → **특히 '밥/흰쌀밥/쌀/물'은 need에 절대 넣지 마세요.** 물은 필요 시 seasoning(예: "물 120ml")로만 표기합니다.
                  → **약어 금지:** '1t/1T' 대신 **'1작은술/1큰술'**로 표기하고, ml/g 단위는 숫자+단위로 적습니다.

                [이미 제안된 제목(중복 금지)]
                - have: %s
                - need: %s

                [다양성 규칙]
                - 제목과 조리법의 **카테고리를 다양화**하세요. '볶음밥/전/국' 같은 동일 계열 반복 금지.
                - 6개 제안 전체에 최소한 다음 중 **서로 다른 4개 이상**을 포함: 볶기, 조림, 무침, 찜/푹삶기, 구이/오븐/에어프라이어, 샐러드/차가운 요리, 토스트/샌드위치/랩, 스튜/전골, 면요리.
                - **제목에 동일 키워드 반복(예: "볶음밥", "전", "국")이 2회를 넘지 않도록** 조절합니다.
                - 밥이 기본 재료이므로, 'need' 섹션의 레시피 제목에도 밥을 전제로 한 메뉴(볶음밥/덮밥 등) 편중을 피하세요.

                [생성 규칙]
                1) "have": haveNow만 사용해서 가능한 레시피 **정확히 5개**.
                   - ingredients.have: haveNow 중 실제 사용한 항목(중복 금지).
                   - ingredients.need: [] (항상 빈 배열)
                   - seasoning: 예) "간장 1큰술", "설탕 1작은술", "물 120ml", "올리브유 1큰술"
                2) "need": haveNow를 기반으로 **추가 재료 1~3개**만 더해 가능한 레시피 **정확히 5개**.
                   - ingredients.have: haveNow 중 실제 사용한 항목(중복 금지).
                   - ingredients.need: haveNow와 겹치지 않는 1~3개(금지 재료 금지, **'밥/쌀/물' 포함 금지**).
                   - seasoning: 위와 동일한 표기 규칙(작은술/큰술).
                3) **실재하는 레시피(혹은 합리적 변형)**만 제안합니다. 과장되거나 비현실적 조합 금지, 제목은 간결한 한국어.
                4) steps는 **7~10단계**로 더 **자세하고 구체적**이어야 합니다.
                5) 모든 배열 항목은 공백 제거 및 중복 없이 작성합니다.

                [출력 JSON 스키마]
                {
                  "notice": "현재 사용자님의 지병 및 알레르기(%s / %s)를 고려하여 기본 재료 사용량을 조절하고 안전한 레시피만 추천했습니다.",
                  "have": [
                    {
                      "title": "제목",
                      "ingredients": {
                        "have": ["보유 재료 중 사용한 것(고유, 중복 없음)"],
                        "need": [],
                        "seasoning": ["간장 1큰술", "설탕 1작은술", "물 120ml", "..."]
                      },
                      "steps": ["1단계 ...", "2단계 ...", "...(7~10단계)"]
                    },
                    { ... 총 5개 }
                  ],
                  "need": [
                    {
                      "title": "제목",
                      "ingredients": {
                        "have": ["보유 재료 중 사용한 것(고유, 중복 없음)"],
                        "need": ["추가 필요한 재료 1~3개(보유/금지 재료와 절대 겹치지 않음, **밥/쌀/물 제외**)"],
                        "seasoning": ["간장 1큰술", "물 150ml", "..."]
                      },
                      "steps": ["1단계 ...", "2단계 ...", "...(7~10단계)"]
                    },
                    { ... 총 5개 }
                  ]
                }
                """.formatted(
                String.join(", ", haveNow),
                diseasesStr, allergiesStr,
                avoidHave.isEmpty() ? "없음" : String.join(", ", avoidHave),
                avoidNeed.isEmpty() ? "없음" : String.join(", ", avoidNeed),
                diseasesStr, allergiesStr
        );
    }

    /** id를 Long으로 생성해서 DTO에 맞춤 */
    private RecipeSuggestionResponse toSuggestion(AiRecipe r) {
        List<String> main = new ArrayList<>();
        if (r.ingredients != null) {
            if (r.ingredients.have != null) main.addAll(r.ingredients.have);
            if (r.ingredients.need != null) main.addAll(r.ingredients.need);
        }
        main = main.stream().filter(Objects::nonNull).map(String::trim).distinct().toList();

        List<String> seasoning = (r.ingredients != null && r.ingredients.seasoning != null)
                ? r.ingredients.seasoning.stream().filter(Objects::nonNull).map(String::trim).toList()
                : List.of();

        List<String> missing = (r.ingredients != null && r.ingredients.need != null)
                ? r.ingredients.need.stream().filter(Objects::nonNull).map(String::trim).distinct().toList()
                : List.of();

        String content = (r.steps == null || r.steps.isEmpty())
                ? ""
                : String.join("\n", r.steps);

        long hash = Integer.toUnsignedLong(Objects.hash(
                Optional.ofNullable(r.title).orElse(""),
                main.toString(),
                seasoning.toString(),
                missing.toString(),
                content
        ));

        return new RecipeSuggestionResponse(
                hash,
                r.title,
                main,
                seasoning,
                missing,
                content
        );
    }

    // =========================
    // 세션(방) 목록/상세 (JPA)
    // =========================
    public List<Map<String, Object>> listSessions(Long memberId) {
        // ★ display_order 기준으로 정렬된 목록
        List<Recipe> list = recipeRepository.findByMemberIdOrderByDisplayOrderAsc(memberId);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        return list.stream()
                .map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("title", r.getName());
                    m.put("createdAt", r.getCreatedAt() == null ? null : fmt.format(r.getCreatedAt()));
                    // 프론트에서 카드에 "생성중" 상태를 표시할 수 있도록
                    m.put("generating", generatingSessions.contains(r.getId()));
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
            log.warn("[AI] DB detail 파싱 실패(id={}): {}", id, ex.toString());
            ai = new AiResponse().sanitize();
            ai.notice = "저장된 레시피 데이터를 읽어오지 못했습니다.";
        }

        Map<String, Object> ret = new HashMap<>();
        ret.put("id", e.getId());
        ret.put("title", e.getName());
        ret.put("have", ai.have.stream().map(this::toSuggestion).toList());
        ret.put("need", ai.need.stream().map(this::toSuggestion).toList());
        ret.put("notice", ai.notice == null ? "" : ai.notice);
        // 프론트 폴링을 위한 생성중 플래그
        ret.put("generating", generatingSessions.contains(id));
        return ret;
    }

    /** 세션 제목 수정 */
    public Map<String, Object> updateSessionTitle(Long memberId, Long sessionId, String title) {
        Recipe e = recipeRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 세션"));

        if (!Objects.equals(e.getMemberId(), memberId)) {
            throw new IllegalArgumentException("본인 세션만 수정할 수 있습니다.");
        }

        String newTitle = (title == null || title.isBlank())
                ? e.getName()
                : title.trim();

        e.setName(newTitle);
        recipeRepository.save(e);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        Map<String, Object> ret = new HashMap<>();
        ret.put("id", e.getId());
        ret.put("title", e.getName());
        ret.put("createdAt", e.getCreatedAt() == null ? null : fmt.format(e.getCreatedAt()));
        ret.put("generating", generatingSessions.contains(e.getId()));
        return ret;
    }

    /** 세션 삭제 */
    public void deleteSession(Long memberId, Long sessionId) {
        Recipe e = recipeRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 세션"));

        if (!Objects.equals(e.getMemberId(), memberId)) {
            throw new IllegalArgumentException("본인 세션만 삭제할 수 있습니다.");
        }

        generatingSessions.remove(sessionId);
        recipeRepository.delete(e);
    }

    /** 세션 순서 재정렬 (drag & drop 결과 저장) */
    public void reorderSessions(Long memberId, List<Long> orderedIds) {
        if (orderedIds == null || orderedIds.isEmpty()) return;

        List<Recipe> recipes = recipeRepository.findByMemberIdAndIdIn(memberId, orderedIds);
        Map<Long, Recipe> map = recipes.stream()
                .collect(Collectors.toMap(Recipe::getId, r -> r));

        long order = 1L;
        for (Long id : orderedIds) {
            Recipe r = map.get(id);
            if (r == null) continue;
            r.setDisplayOrder(order++);
        }

        recipeRepository.saveAll(map.values());
    }

    // ====== 내부 DTO ======
    record Health(Set<String> diseases, Set<String> allergies) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AiResponse {
        public String notice;
        public List<AiRecipe> have = new ArrayList<>();
        public List<AiRecipe> need = new ArrayList<>();

        AiResponse sanitize() {
            if (have == null) have = new ArrayList<>();
            if (need == null) need = new ArrayList<>();
            have.forEach(r -> { if (r.title == null) r.title = "이름 없는 레시피"; });
            need.forEach(r -> { if (r.title == null) r.title = "이름 없는 레시피"; });
            if (notice == null) notice = "";
            return this;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AiRecipe {
        public String title;
        public Ingredients ingredients = new Ingredients();
        public List<String> steps = new ArrayList<>();
        public AiRecipe() {}
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Ingredients {
        public List<String> have = new ArrayList<>();
        public List<String> need = new ArrayList<>();
        public List<String> seasoning = new ArrayList<>();
    }
}
