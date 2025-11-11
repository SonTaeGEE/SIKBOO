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

    // 목록 조회
    /**
     * memberId 소유 재료 목록을 페이지로 조회.
     * - location이 null이 아니면 enum.name() 으로 문자열 전달하여 DB에서 필터링
     * - q가 비어있으면 null로 치환하여 LIKE 조건 제거
     * - sort, order로 정렬 기준 생성
     * - Page<Ingredient> → Page<IngredientResponseDTO> 매핑 후 PageResponseDTO로 감쌈
     */
    public PageResponseDTO<IngredientResponseDTO> list(
            Long memberId, IngredientLocation location, String q,
            int page, int size, String sort, String order
    ) {
        Sort s = sort(sort, order);

        // location(enum)을 네이티브 쿼리 비교를 위해 String(name) 으로 변환
        String loc = (location == null) ? null : location.name();

        Page<Ingredient> result = repo.search(
                memberId,
                loc,
                emptyToNull(q),
//                PageRequest.of(page, size, s)
                PageRequest.of(page, size)
        );

        // 엔티티 → 응답 DTO 매핑 (KST 기준 포맷/계산 반영)
        Page<IngredientResponseDTO> mapped = result.map(i -> IngredientResponseDTO.from(i, KST));
        return PageResponseDTO.from(mapped);
    }

    // 단건 조회
    /**
     * 소유자(memberId) 검증을 포함한 단건 조회.
     * - 없으면 404(NotFound) 예외 발생
     */
    public IngredientResponseDTO get(Long memberId, Long id) {
        Ingredient i = repo.findByIdAndMemberId(id, memberId).orElseThrow(NotFound::new);
        return IngredientResponseDTO.from(i, KST);
    }

    // 생성
    public Long create(Long memberId, CreateIngredientRequestDTO req) {
        if (req == null) throw badRequest("요청 본문이 비어있습니다.");
        if (isBlank(req.ingredientName())) throw badRequest("ingredientName 은 필수입니다.");
        if (req.location() == null) throw badRequest("location 은 필수입니다.");
        if (isBlank(req.due())) throw badRequest("due(YYYY-MM-DD) 는 필수입니다.");

        // due 파싱
        LocalDate dueDate;
        try {
            dueDate = LocalDate.parse(req.due());
        } catch (DateTimeParseException e) {
            throw badRequest("due 형식이 올바르지 않습니다. 예: 2025-11-30");
        }

        // "KST 기준 자정"을 LocalDateTime으로. (ZonedDateTime → LocalDateTime)
        LocalDateTime dueDateTime = dueDate.atStartOfDay(KST).toLocalDateTime();

        // --- 중복 검사 ---
        // 동일 날짜 구간 [start, end) (= 해당 날짜의 00:00 ~ 다음날 00:00) + 동일 location 범위 내 후보 조회
        LocalDateTime start = dueDate.atStartOfDay(KST).toLocalDateTime();
        LocalDateTime end   = start.plusDays(1);
        var candidates = repo.findDupCandidates(
                memberId,
                req.location().name(), // enum → String
                start, end
        );

        // 이름 정규화 후 동일성 비교(대소문자/공백/정규화 차이 제거)
        String newNorm = norm(req.ingredientName());
        boolean dup = candidates.stream().anyMatch(c -> norm(c.getIngredientName()).equals(newNorm));
        if (dup) throw new Duplicate(req.ingredientName(), req.location().name(), req.due());

        // 저장
        Ingredient saved = repo.save(Ingredient.builder()
                .memberId(memberId)
                .ingredientName(req.ingredientName())
                .location(req.location())
                .due(dueDateTime)
                .memo(req.memo())
                .build());

        return saved.getId();
    }

    // 수정
    public IngredientResponseDTO update(Long memberId, Long id, UpdateIngredientRequestDTO req) {
        Ingredient i = repo.findByIdAndMemberId(id, memberId).orElseThrow(NotFound::new);

        // 이름: 없으면 기존 유지
        String newName = (req != null && !isBlank(req.ingredientName())) ? req.ingredientName() : i.getIngredientName();

        // 위치(location): 없으면 기존 유지
        IngredientLocation newLoc = (req != null && req.location() != null) ? req.location() : i.getLocation();

        // due: 없으면 기존 유지, 있으면 파싱(형식 오류 시 400)
        LocalDate newDueDate;
        if (req != null && !isBlank(req.due())) {
            try { newDueDate = LocalDate.parse(req.due()); }
            catch (DateTimeParseException e) { throw badRequest("due 형식이 올바르지 않습니다. 예: 2025-11-30"); }
        } else {
            newDueDate = i.getDue().toLocalDate();
        }
        LocalDateTime newDueDateTime = newDueDate.atStartOfDay(KST).toLocalDateTime();

        // --- 자신 제외 중복 검사 ---
        LocalDateTime start = newDueDate.atStartOfDay(KST).toLocalDateTime();
        LocalDateTime end   = start.plusDays(1);
        var candidates = repo.findDupCandidates(
                memberId,
                newLoc.name(), // enum → String
                start, end
        );
        String newNorm = norm(newName);
        boolean dup = candidates.stream()
                .anyMatch(c -> !c.getId().equals(id) && norm(c.getIngredientName()).equals(newNorm));
        if (dup) throw new Duplicate(newName, newLoc.name(), newDueDate.toString());

        // 변경(영속 엔티티: save 호출 없이 더티체킹으로 반영)
        i.setIngredientName(newName);
        i.setLocation(newLoc);
        i.setDue(newDueDateTime);
        if (req != null && req.memo() != null) i.setMemo(req.memo());

        return IngredientResponseDTO.from(i, KST);
    }

    // 삭제
//    public void delete(Long memberId, Long id) {
//        Ingredient i = repo.findByIdAndMemberId(id, memberId).orElseThrow(NotFound::new);
//        repo.delete(i);
//    }
    public void delete(Long memberId, Long id) {
        System.out.println("삭제 시도: memberId=" + memberId + ", ingredientId=" + id); // ★ 디버깅 로그
        Ingredient i = repo.findByIdAndMemberId(id, memberId).orElseThrow(() -> {
            System.err.println("레코드를 찾을 수 없음: ingredientId=" + id + ", memberId=" + memberId); // ★
            return new NotFound();
        });
        System.out.println("삭제 대상: " + i.getIngredientName()); // ★
        repo.delete(i);
        System.out.println("삭제 완료: ingredientId=" + id); // ★
    }

    // helpers
    // 400 Bad Request 헬퍼
    private static ResponseStatusException badRequest(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    // 공백/널 체크
    private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }

    // 빈 문자열을 null로
    private static String emptyToNull(String s) { return (s == null || s.isBlank()) ? null : s; }

    
    // 정렬 기준 생성
    private static Sort sort(String sort, String order) {
        Sort.Direction dir = "desc".equalsIgnoreCase(order) ? Sort.Direction.DESC : Sort.Direction.ASC;
        if ("name".equalsIgnoreCase(sort) || "ingredientName".equalsIgnoreCase(sort)) {
            return Sort.by(new Sort.Order(dir, "ingredientName"), Sort.Order.asc("due"));
        }
        return Sort.by(Sort.Order.asc("due"), Sort.Order.asc("ingredientName"));
    }

    // 이름 정규화
    
    private static String norm(String s) {
        if (s == null) return "";
        String t = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFKC);
        t = t.toLowerCase(java.util.Locale.ROOT);
        return t.replaceAll("\\s+", "");
    }

    // 예외 타입 (상태코드 매핑)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public static class NotFound extends RuntimeException {}

    @ResponseStatus(HttpStatus.CONFLICT)
    public static class Duplicate extends RuntimeException {
        public Duplicate(String name, String loc, String due) {
            super("Duplicate: " + name + " / " + loc + " / " + due);
        }
    }
}
