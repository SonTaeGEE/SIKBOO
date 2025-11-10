package com.stg.sikboo.ingredient.presentation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException; // ★ 401 등 상태코드 직접 매핑용

import com.stg.sikboo.ingredient.domain.IngredientLocation;
import com.stg.sikboo.ingredient.dto.request.CreateIngredientRequestDTO;
import com.stg.sikboo.ingredient.dto.request.UpdateIngredientRequestDTO;
import com.stg.sikboo.ingredient.dto.response.IngredientResponseDTO;
import com.stg.sikboo.ingredient.dto.response.PageResponseDTO;
import com.stg.sikboo.ingredient.service.IngredientService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ingredients")
public class IngredientController {

    private final IngredientService service;

    /** 목록: 내 것만, 위치/검색/정렬/페이징 지원 */
    @GetMapping
    public PageResponseDTO<IngredientResponseDTO> list(
    		@RequestParam(name = "location", required = false) IngredientLocation location,
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", required = false) String sort,
            @RequestParam(name = "order", required = false) String order
    ) {
        Long memberId = currentMemberId(); // ★ 오너십 보장(항상 내 memberId만 사용)
        return service.list(memberId, location, q, page, size, sort, order);
    }

    /** 단건 조회: 오너십 강제(findByIdAndMemberId) */
    @GetMapping("/{id}")
    public IngredientResponseDTO get(@PathVariable Long id) {
        return service.get(currentMemberId(), id);
    }

    /** 생성: 서버가 JWT에서 memberId를 주입(클라이언트가 임의 변경 불가) */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateIngredientRequestDTO req) {
        // SecurityContext에서 memberId 클레임 추출 (없으면 401)
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        Long memberId;
        Object principal = auth.getPrincipal();
        if (principal instanceof Jwt jwt) {
            Object claim = jwt.getClaim("memberId");
            if (claim == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
            try {
                memberId = Long.valueOf(String.valueOf(claim));
            } catch (NumberFormatException ex) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
            }
        } else {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        Long id = service.create(memberId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(new IdRes(id));
    }

    /** 수정: 부분수정 + 자신 제외 중복 검사 */
    @PatchMapping("/{id}")
    public IngredientResponseDTO update(@PathVariable Long id, @RequestBody UpdateIngredientRequestDTO req) {
        return service.update(currentMemberId(), id, req);
    }

    /** 삭제: 내 소유만 삭제 가능 */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(currentMemberId(), id);
    }

    /** 생성 응답용 심플 DTO */
    public record IdRes(Long id) {}

    /** SecurityContext에서 memberId 클레임 추출 (없으면 401) */
    private Long currentMemberId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        Object p = auth.getPrincipal();
        if (p instanceof Jwt jwt) {
            Object v = jwt.getClaim("memberId");
            if (v instanceof Integer i) return i.longValue();
            if (v instanceof Long l) return l;
            if (v instanceof String s) return Long.parseLong(s);
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "memberId 클레임이 없습니다.");
    }
}
