package com.stg.sikboo.participant.presentation;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.stg.sikboo.participant.dto.response.MyGroupBuyingResponse;
import com.stg.sikboo.participant.dto.request.ParticipantJoinRequest;
import com.stg.sikboo.participant.dto.response.ParticipantResponse;
import com.stg.sikboo.participant.service.ParticipantService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/participants")
@RequiredArgsConstructor
public class ParticipantController {
    
    private final ParticipantService participantService;
     
    /**
     * 공동구매 참여
     */
    @PostMapping
    public ResponseEntity<ParticipantResponse> joinGroupBuying(
            @Valid @RequestBody ParticipantJoinRequest request) {
        ParticipantResponse response = participantService.joinGroupBuying(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 공동구매 나가기
     */
    @DeleteMapping
    public ResponseEntity<Void> leaveGroupBuying(
            @RequestParam("groupBuyingId") Long groupBuyingId,
            @RequestParam("memberId") Long memberId) {
        participantService.leaveGroupBuying(groupBuyingId, memberId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 특정 공동구매의 참여자 목록 조회
     */
    @GetMapping("/groupbuying/{groupBuyingId}")
    public ResponseEntity<List<ParticipantResponse>> getParticipantsByGroupBuying(
            @PathVariable("groupBuyingId") Long groupBuyingId) {
        List<ParticipantResponse> responses = participantService.getParticipantsByGroupBuying(groupBuyingId);
        return ResponseEntity.ok(responses);
    }
    
    /**
     * 내가 참여한 공동구매 목록 조회
     */
    @GetMapping("/my")
    public ResponseEntity<List<MyGroupBuyingResponse>> getMyParticipatingGroupBuyings(
            @RequestParam("memberId") Long memberId) {
        List<MyGroupBuyingResponse> responses = participantService.getMyParticipatingGroupBuyings(memberId);
        return ResponseEntity.ok(responses);
    }
    
    /**
     * 참여 여부 확인
     */
    @GetMapping("/check")
    public ResponseEntity<Boolean> isParticipating(
            @RequestParam("groupBuyingId") Long groupBuyingId,
            @RequestParam("memberId") Long memberId) {
        boolean isParticipating = participantService.isParticipating(groupBuyingId, memberId);
        return ResponseEntity.ok(isParticipating);
    }
    
    /**
     * 참여자 수 조회
     */
    @GetMapping("/count/{groupBuyingId}")
    public ResponseEntity<Long> countParticipants(@PathVariable("groupBuyingId") Long groupBuyingId) {
        long count = participantService.countParticipants(groupBuyingId);
        return ResponseEntity.ok(count);
    }
}
