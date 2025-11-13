package com.stg.sikboo.ingredient.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stg.sikboo.ingredient.domain.Ingredient;
import com.stg.sikboo.ingredient.domain.IngredientLocation;
import com.stg.sikboo.ingredient.domain.IngredientRepository;
import com.stg.sikboo.ingredient.dto.request.CreateIngredientRequestDTO;
import com.stg.sikboo.ingredient.dto.request.UpdateIngredientRequestDTO;
import com.stg.sikboo.ingredient.dto.response.AnalyzeTextResponse;
import com.stg.sikboo.ingredient.dto.response.IngredientItem;
import com.stg.sikboo.ingredient.dto.response.IngredientResponseDTO;
import com.stg.sikboo.ingredient.dto.response.PageResponseDTO;
import com.stg.sikboo.onboarding.infra.TextSanitizer;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class IngredientService {

    private final IngredientRepository repo;
    private final OpenAiChatModel chatModel;
    private final ObjectMapper objectMapper;

    // 한국 시간대. due(유통기한)를 "KST 00:00" 기준 LocalDateTime으로 저장/비교
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    // 위치별 기본 보관일
    private static final int DAYS_FRIDGE = 7;   // 냉장고
    private static final int DAYS_FREEZER = 90; // 냉동실
    private static final int DAYS_ROOM    = 3;  // 실온

    // ========== 기존 CRUD 메서드 ==========

    // 목록 조회
    public PageResponseDTO<IngredientResponseDTO> list(
            Long memberId, IngredientLocation location, String q,
            int page, int size, String sort, String order
    ) {
        Sort s = sort(sort, order);

        String loc = (location == null) ? null : location.name();

        Page<Ingredient> result = repo.search(
                memberId,
                loc,
                emptyToNull(q),
                PageRequest.of(page, size)
        );

        Page<IngredientResponseDTO> mapped = result.map(i -> IngredientResponseDTO.from(i, KST));
        return PageResponseDTO.from(mapped);
    }

    // 단건 조회
    public IngredientResponseDTO get(Long memberId, Long id) {
        Ingredient i = repo.findByIdAndMemberId(id, memberId).orElseThrow(NotFound::new);
        return IngredientResponseDTO.from(i, KST);
    }

    // 생성: due 미입력 시 위치별 자동보정(+7/+90/+3, KST 자정)
    public Long create(Long memberId, CreateIngredientRequestDTO req) {
        if (req == null) throw badRequest("요청 본문이 비어있습니다.");
        if (isBlank(req.ingredientName())) throw badRequest("ingredientName 은 필수입니다.");
        if (req.location() == null) throw badRequest("location 은 필수입니다.");

        final boolean hasDueInput = !isBlank(req.due());
        final LocalDateTime dueLdt = hasDueInput
                ? parseToKstMidnight(req.due())
                : estimateByLocation(req.location());

        // --- 중복 검사 (최종 due 기준) ---
        LocalDate theDate = dueLdt.toLocalDate();
        LocalDateTime start = theDate.atStartOfDay(KST).toLocalDateTime();
        LocalDateTime end   = start.plusDays(1);
        var candidates = repo.findDupCandidates(
                memberId,
                req.location().name(),
                start, end
        );
        String newNorm = norm(req.ingredientName());
        boolean dup = candidates.stream().anyMatch(c -> norm(c.getIngredientName()).equals(newNorm));
        if (dup) throw new Duplicate(req.ingredientName(), req.location().name(), theDate.toString());

        Ingredient saved = repo.save(Ingredient.builder()
                .memberId(memberId)
                .ingredientName(req.ingredientName())
                .location(req.location())
                .due(dueLdt)
                .isDueEstimated(!hasDueInput)   // 입력 없으면 true, 있으면 false
                .memo(req.memo())
                .build());

        return saved.getId();
    }

    // 수정
    public IngredientResponseDTO update(Long memberId, Long id, UpdateIngredientRequestDTO req) {
        Ingredient i = repo.findByIdAndMemberId(id, memberId).orElseThrow(NotFound::new);

        String newName = (req != null && !isBlank(req.ingredientName())) ? req.ingredientName() : i.getIngredientName();
        IngredientLocation newLoc = (req != null && req.location() != null) ? req.location() : i.getLocation();

        // 1) 사용자가 due를 보냈으면 → 그 값 적용 + 추정 아님(false)
        if (req != null && !isBlank(req.due())) {
            LocalDateTime newDueLdt = parseToKstMidnight(req.due());
            i.setDue(newDueLdt);
            i.setDueEstimated(false);
        }
        // 2) due 미전송 + location만 바뀜 → 기존이 추정값(true)이면 재추정
        else if (!newLoc.equals(i.getLocation()) && i.isDueEstimated()) {
            LocalDateTime reEstimated = estimateByLocation(newLoc);
            i.setDue(reEstimated);
            i.setDueEstimated(true);
        }
        // (그 외) 날짜/플래그 유지

        // 필수 변경 반영
        i.setIngredientName(newName);
        i.setLocation(newLoc);
        if (req != null && req.memo() != null) i.setMemo(req.memo());

        // --- 자신 제외 중복 검사 (최종 값 기준) ---
        LocalDate newDueDate = i.getDue().toLocalDate();
        LocalDateTime start = newDueDate.atStartOfDay(KST).toLocalDateTime();
        LocalDateTime end   = start.plusDays(1);
        var candidates = repo.findDupCandidates(
                memberId,
                newLoc.name(),
                start, end
        );
        String newNorm = norm(newName);
        boolean dup = candidates.stream()
                .anyMatch(c -> !c.getId().equals(id) && norm(c.getIngredientName()).equals(newNorm));
        if (dup) throw new Duplicate(newName, newLoc.name(), newDueDate.toString());

        return IngredientResponseDTO.from(i, KST);
    }

    // 삭제
    public void delete(Long memberId, Long id) {
        log.debug("삭제 시도: memberId={}, ingredientId={}", memberId, id);
        Ingredient i = repo.findByIdAndMemberId(id, memberId).orElseThrow(() -> {
            log.error("레코드를 찾을 수 없음: ingredientId={}, memberId={}", id, memberId);
            return new NotFound();
        });
        log.debug("삭제 대상: {}", i.getIngredientName());
        repo.delete(i);
        log.info("삭제 완료: ingredientId={}", id);
    }

    // ========== AI 자연어 분석 ==========

    /** AI 자연어 분석 */
    public AnalyzeTextResponse analyzeText(Long memberId, String text) {
        if (isBlank(text)) {
            throw badRequest("분석할 내용이 비어있습니다.");
        }

        String prompt = buildAnalysisPrompt(text);

        log.info("AI 분석 시작: memberId={}", memberId);
        log.debug("사용자 입력: {}", text);

        Prompt aiPrompt = new Prompt(new UserMessage(prompt));
        var response = chatModel.call(aiPrompt);
        String aiOutput = response.getResult().getOutput().getContent();

        log.info("=== AI 응답 처리 ===");
        log.info("AI 원본 응답: {}", aiOutput);

        try {
            // ✅ 마크다운 코드 블록 제거
            String cleanedJson = cleanJsonResponse(aiOutput);
            log.info("정제된 JSON: {}", cleanedJson);

            // JSON 파싱
            List<IngredientItem> items = objectMapper.readValue(
                cleanedJson,
                new TypeReference<List<IngredientItem>>() {}
            );

            // ✅ 파싱된 결과 로그
            for (IngredientItem item : items) {
                log.info("파싱 결과 - 이름: [{}], 보관: [{}], 기한: {}일",
                    item.getName(), item.getStorage(), item.getExpiryDays());
            }

            log.info("AI 분석 완료: {}개 항목", items.size());
            return new AnalyzeTextResponse(items);

        } catch (Exception e) {
            log.error("AI 응답 파싱 실패: {}", aiOutput, e);
            throw new RuntimeException("AI 분석 결과를 처리할 수 없습니다: " + e.getMessage(), e);
        }
    }

    /** AI 응답에서 순수 JSON만 추출 */
    private String cleanJsonResponse(String response) {
        if (response == null) return "";

        String cleaned = response.trim();

        // 1. 마크다운 코드 블록 제거 (```json ... ``` 또는 ``` ... ```)
        if (cleaned.startsWith("```")) {
            int firstNewline = cleaned.indexOf('\n');
            if (firstNewline != -1) {
                cleaned = cleaned.substring(firstNewline + 1);
            }
            int lastBacktick = cleaned.lastIndexOf("```");
            if (lastBacktick != -1) {
                cleaned = cleaned.substring(0, lastBacktick);
            }
        }

        // 2. 앞뒤 공백 제거
        cleaned = cleaned.trim();

        // 3. 전체가 따옴표로 감싸진 경우 제거
        if (cleaned.startsWith("\"") && cleaned.endsWith("\"")) {
            cleaned = cleaned.substring(1, cleaned.length() - 1);
            cleaned = cleaned.replace("\\\"", "\"");
            cleaned = cleaned.replace("\\n", "\n");
        }

        return cleaned;
    }

    /** AI 분석 결과 저장 (여기만 sanitize 적용) */
    public void addIngredientsFromAi(Long memberId, List<IngredientItem> items) {
        if (items == null || items.isEmpty()) {
            throw badRequest("저장할 항목이 없습니다.");
        }

        LocalDate today = LocalDate.now(KST);
        List<Ingredient> batch = new ArrayList<>();

        for (IngredientItem item : items) {
            String cleanName = TextSanitizer.sanitize(item.getName());       // ✅ 중앙 유틸
            String cleanStorage = TextSanitizer.sanitize(item.getStorage());  // ✅ 중앙 유틸

            log.info("저장할 데이터 - name: [{}], storage: [{}]", cleanName, cleanStorage);

            if (cleanName.isEmpty()) {
                log.warn("재료명이 비어있어 건너뜀");
                continue;
            }

            IngredientLocation location = parseLocation(cleanStorage);
            LocalDateTime dueDateTime = today.plusDays(item.getExpiryDays())
                .atStartOfDay(KST)
                .toLocalDateTime();

            // 중복 검사
            LocalDateTime start = dueDateTime.toLocalDate().atStartOfDay(KST).toLocalDateTime();
            LocalDateTime end = start.plusDays(1);
            var candidates = repo.findDupCandidates(memberId, location.name(), start, end);

            String newNorm = norm(cleanName);
            boolean dup = candidates.stream()
                .anyMatch(c -> norm(c.getIngredientName()).equals(newNorm));

            if (dup) {
                log.warn("중복 식재료 건너뜀: {}", cleanName);
                continue;
            }

            Ingredient ingredient = Ingredient.builder()
                .memberId(memberId)
                .ingredientName(cleanName)  // ✅ 정제된 값 저장
                .location(location)
                .due(dueDateTime)
                .isDueEstimated(false)
                .build();

            batch.add(ingredient);
        }

        if (!batch.isEmpty()) {
            repo.saveAll(batch);
            log.info("AI 재료 저장 완료: memberId={}, count={}", memberId, batch.size());
        }
    }

    /** (미사용) 식재료명/보관장소 정제 */
    private String cleanIngredientName(String name) {
        if (name == null) return "";
        return name.trim()
            .replace("\"", "")
            .replace("'", "")
            .replaceAll("\\s+", " ")
            .trim();
    }

    // ========== Private Helper Methods ==========

    /** AI 프롬프트 생성 */
    private String buildAnalysisPrompt(String userInput) {
        return String.format("""
            당신은 식재료 관리 전문가입니다.
            사용자가 자연스럽게 말한 내용에서 식재료 정보를 추출해주세요.

            [사용자 입력]
            %s

            [중요: 출력 형식]
            반드시 순수 JSON 배열만 출력하세요.
            - 마크다운 코드 블록(```)을 사용하지 마세요
            - 설명 문구를 추가하지 마세요
            - 따옴표로 전체를 감싸지 마세요
            - JSON 배열만 출력하세요

            [JSON 구조]
            [
              {
                "name": "식재료명",
                "storage": "냉장고",
                "expiryDays": 7
              }
            ]

            [규칙]
            1. 식재료명은 간단하게 (예: "배추김치" → "김치")
            2. storage는 반드시 "냉장고", "냉동실", "실온" 중 하나
            3. expiryDays 기본값:
               - 냉장고: 7일
               - 냉동실: 90일
               - 실온: 3일
            4. 사용자가 명시한 기한이 있으면 그것을 우선 사용
            5. "소비기한 3일 남았다" = expiryDays: 3
            6. "오늘 샀다" = 기본값 사용
            7. 보관 장소가 명시되지 않으면 일반적인 상식으로 추론 (예: 우유→냉장고, 라면→실온, 만두→냉동실)
            8. name과 storage에는 따옴표(“ ” ‘ ’ " ' ` 등)나 불필요 기호를 포함하지 마세요.

            [올바른 출력 예시]
            [
              { "name": "김치", "storage": "냉장고", "expiryDays": 7 },
              { "name": "우유",  "storage": "냉장고", "expiryDays": 3 }
            ]

            [잘못된 출력 예시 - 이렇게 하지 마세요]
            ```json
            [...]
            ```
            "[...]"

            다시 한번 강조합니다: 순수 JSON 배열만 출력하세요.
            """, userInput);
    }

    /** 문자열 보관장소 → Enum 변환 (AI 경로 전용 sanitize 포함) */
    private IngredientLocation parseLocation(String storage) {
        if (storage == null || storage.isBlank()) {
            throw badRequest("보관장소가 지정되지 않았습니다.");
        }
        String cleaned = TextSanitizer.sanitize(storage);  // ✅ 중앙 유틸
        return switch (cleaned) {
            case "냉장고" -> IngredientLocation.냉장고;
            case "냉동실" -> IngredientLocation.냉동실;
            case "실온" -> IngredientLocation.실온;
            default -> throw badRequest("알 수 없는 보관장소: " + cleaned);
        };
    }

    private static ResponseStatusException badRequest(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private static Sort sort(String sort, String order) {
        Sort.Direction dir = "desc".equalsIgnoreCase(order) ? Sort.Direction.DESC : Sort.Direction.ASC;
        if ("name".equalsIgnoreCase(sort) || "ingredientName".equalsIgnoreCase(sort)) {
            return Sort.by(new Sort.Order(dir, "ingredientName"), Sort.Order.asc("due"));
        }
        return Sort.by(Sort.Order.asc("due"), Sort.Order.asc("ingredientName"));
    }

    private static String norm(String s) {
        if (s == null) return "";
        String t = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFKC);
        t = t.toLowerCase(java.util.Locale.ROOT);
        return t.replaceAll("\\s+", "");
    }

    // "YYYY-MM-DD" → KST 자정(LocalDateTime)
    private static LocalDateTime parseToKstMidnight(String ymd) {
        try {
            LocalDate d = LocalDate.parse(ymd);
            return d.atStartOfDay(KST).toLocalDateTime();
        } catch (DateTimeParseException e) {
            throw badRequest("due 형식이 올바르지 않습니다. 예: 2025-11-30");
        }
    }

    // 위치별 규칙으로 오늘 기준 자동 추정 → KST 자정
    private static LocalDateTime estimateByLocation(IngredientLocation loc) {
        int plusDays = switch (loc) {
            case 냉장고 -> DAYS_FRIDGE;
            case 냉동실 -> DAYS_FREEZER;
            case 실온   -> DAYS_ROOM;
        };
        LocalDate target = LocalDate.now(KST).plusDays(plusDays);
        return target.atStartOfDay(KST).toLocalDateTime();
    }

    // ========== Exception Classes ==========

    @ResponseStatus(HttpStatus.NOT_FOUND)
    public static class NotFound extends RuntimeException {
        public NotFound() {
            super("요청한 식재료를 찾을 수 없습니다.");
        }
    }

    @ResponseStatus(HttpStatus.CONFLICT)
    public static class Duplicate extends RuntimeException {
        public Duplicate(String name, String loc, String due) {
            super("중복된 식재료: " + name + " / " + loc + " / " + due);
        }
    }
}
