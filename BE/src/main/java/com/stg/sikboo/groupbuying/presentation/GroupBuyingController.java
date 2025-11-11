package com.stg.sikboo.groupbuying.presentation;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.stg.sikboo.groupbuying.domain.GroupBuying.Category;
import com.stg.sikboo.groupbuying.dto.request.GroupBuyingCreateRequest;
import com.stg.sikboo.groupbuying.dto.request.GroupBuyingUpdateRequest;
import com.stg.sikboo.groupbuying.dto.response.GroupBuyingResponse;
import com.stg.sikboo.groupbuying.service.GroupBuyingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/groupbuyings")
@RequiredArgsConstructor
public class GroupBuyingController {
    
    private final GroupBuyingService groupBuyingService;
    
    /**
     * 공동구매 생성
     */
    @PostMapping
    public ResponseEntity<GroupBuyingResponse> createGroupBuying(
            @Valid @RequestBody GroupBuyingCreateRequest request) {
        GroupBuyingResponse response = groupBuyingService.createGroupBuying(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 공동구매 단건 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<GroupBuyingResponse> getGroupBuying(@PathVariable("id") Long id) {
        GroupBuyingResponse response = groupBuyingService.getGroupBuying(id);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 전체 공동구매 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<GroupBuyingResponse>> getAllGroupBuyings() {
        List<GroupBuyingResponse> responses = groupBuyingService.getAllGroupBuyings();
        return ResponseEntity.ok(responses);
    }
    
    /**
     * 모집중인 공동구매 목록 조회
     */
    @GetMapping("/active")
    public ResponseEntity<List<GroupBuyingResponse>> getActiveGroupBuyings() {
        List<GroupBuyingResponse> responses = groupBuyingService.getActiveGroupBuyings();
        return ResponseEntity.ok(responses);
    }
    
    /**
     * 카테고리별 공동구매 목록 조회
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<GroupBuyingResponse>> getGroupBuyingsByCategory(
            @PathVariable("category") Category category) {
        List<GroupBuyingResponse> responses = groupBuyingService.getGroupBuyingsByCategory(category);
        return ResponseEntity.ok(responses);
    }
    
    /**
     * 내가 만든 공동구매 목록 조회
     */
    @GetMapping("/my")
    public ResponseEntity<List<GroupBuyingResponse>> getMyGroupBuyings(
            @RequestParam("memberId") Long memberId) {
        List<GroupBuyingResponse> responses = groupBuyingService.getMyGroupBuyings(memberId);
        return ResponseEntity.ok(responses);
    }
    
    /**
     * 공동구매 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<GroupBuyingResponse> updateGroupBuying(
            @PathVariable("id") Long id,
            @Valid @RequestBody GroupBuyingUpdateRequest request) {
        GroupBuyingResponse response = groupBuyingService.updateGroupBuying(id, request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 공동구매 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroupBuying(@PathVariable("id") Long id) {
        groupBuyingService.deleteGroupBuying(id);
        return ResponseEntity.noContent().build();
    }
    
}
