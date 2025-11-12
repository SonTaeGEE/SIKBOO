package com.stg.sikboo.ingredient.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ResponseStatusException;

import com.stg.sikboo.ingredient.domain.Ingredient;
import com.stg.sikboo.ingredient.domain.IngredientLocation;
import com.stg.sikboo.ingredient.domain.IngredientRepository;
import com.stg.sikboo.ingredient.dto.request.CreateIngredientRequestDTO;
import com.stg.sikboo.ingredient.dto.request.UpdateIngredientRequestDTO;
import com.stg.sikboo.ingredient.dto.response.IngredientResponseDTO;
import com.stg.sikboo.ingredient.dto.response.PageResponseDTO;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class IngredientService {

    private final IngredientRepository repo;

    // 한국 시간대. due(유통기한)를 "KST 00:00" 기준 LocalDateTime으로 저장/비교
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    // 위치별 기본 보관일
    private static final int DAYS_FRIDGE = 7;   // 냉장고
    private static final int DAYS_FREEZER = 90; // 냉동실
    private static final int DAYS_ROOM    = 3;  // 실온

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
                // PageRequest.of(page, size, s)  // 네이티브 쿼리에 ORDER BY가 있어 s 미사용
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
        System.out.println("삭제 시도: memberId=" + memberId + ", ingredientId=" + id);
        Ingredient i = repo.findByIdAndMemberId(id, memberId).orElseThrow(() -> {
            System.err.println("레코드를 찾을 수 없음: ingredientId=" + id + ", memberId=" + memberId);
            return new NotFound();
        });
        System.out.println("삭제 대상: " + i.getIngredientName());
        repo.delete(i);
        System.out.println("삭제 완료: ingredientId=" + id);
    }

    // helpers
    private static ResponseStatusException badRequest(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }

    private static String emptyToNull(String s) { return (s == null || s.isBlank()) ? null : s; }

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

    // 예외 타입
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public static class NotFound extends RuntimeException {}

    @ResponseStatus(HttpStatus.CONFLICT)
    public static class Duplicate extends RuntimeException {
        public Duplicate(String name, String loc, String due) {
            super("Duplicate: " + name + " / " + loc + " / " + due);
        }
    }
}
