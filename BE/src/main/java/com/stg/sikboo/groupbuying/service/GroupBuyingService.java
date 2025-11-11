package com.stg.sikboo.groupbuying.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stg.sikboo.groupbuying.domain.GroupBuying;
import com.stg.sikboo.groupbuying.domain.GroupBuying.Category;
import com.stg.sikboo.groupbuying.domain.GroupBuying.Status;
import com.stg.sikboo.groupbuying.domain.repository.GroupBuyingRepository;
import com.stg.sikboo.groupbuying.dto.request.GroupBuyingCreateRequest;
import com.stg.sikboo.groupbuying.dto.request.GroupBuyingUpdateRequest;
import com.stg.sikboo.groupbuying.dto.response.GroupBuyingResponse;
import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.member.domain.MemberRepository;
import com.stg.sikboo.participant.domain.Participant;
import com.stg.sikboo.participant.domain.repository.ParticipantRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupBuyingService {
    
    private final GroupBuyingRepository groupBuyingRepository;
    private final MemberRepository memberRepository;
    private final ParticipantRepository participantRepository;
    
    /**
     * 공동구매 생성
     * 생성 시 주최자가 자동으로 참여자로 등록됩니다.
     */
    @Transactional
    public GroupBuyingResponse createGroupBuying(GroupBuyingCreateRequest request) {
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        
        GroupBuying groupBuying = GroupBuying.builder()
                .member(member)
                .title(request.getTitle())
                .category(request.getCategory())
                .totalPrice(request.getTotalPrice())
                .maxPeople(request.getMaxPeople())
                .currentPeople(0) 
                .info(request.getInfo())
                .pickupLocation(request.getPickupLocation())
                .pickupLatitude(request.getPickupLatitude())
                .pickupLongitude(request.getPickupLongitude())
                .deadline(request.getDeadline())
                .status(Status.모집중)
                .build();
        
        GroupBuying saved = groupBuyingRepository.save(groupBuying);
        
        // 주최자를 참여자 목록에 자동 추가
        Participant participant = Participant.builder()
                .groupBuying(saved)
                .member(member)
                .build();
        
        participantRepository.save(participant);
        
        return GroupBuyingResponse.from(saved);
    }
    
    /**
     * 공동구매 단건 조회
     */
    public GroupBuyingResponse getGroupBuying(Long id) {
        GroupBuying groupBuying = groupBuyingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        return GroupBuyingResponse.from(groupBuying);
    }
    
    /**
     * 전체 공동구매 목록 조회 (최신순)
     */
    public List<GroupBuyingResponse> getAllGroupBuyings() {
        return groupBuyingRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(GroupBuyingResponse::from)
                .collect(Collectors.toList());
    }
    
    /**
     * 모집중인 공동구매 목록 조회 (최신순)
     */
    public List<GroupBuyingResponse> getActiveGroupBuyings() {
        LocalDateTime now = LocalDateTime.now();
        return groupBuyingRepository.findByStatusAndDeadlineAfter(Status.모집중, now).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(GroupBuyingResponse::from)
                .collect(Collectors.toList());
    }
    
    /**
     * 카테고리별 공동구매 목록 조회 (최신순)
     */
    public List<GroupBuyingResponse> getGroupBuyingsByCategory(Category category) {
        return groupBuyingRepository.findByCategory(category).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(GroupBuyingResponse::from)
                .collect(Collectors.toList());
    }
    
    /**
     * 내가 만든 공동구매 목록 조회 (최신순)
     */
    public List<GroupBuyingResponse> getMyGroupBuyings(Long memberId) {
        return groupBuyingRepository.findByMember_Id(memberId).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(GroupBuyingResponse::from)
                .collect(Collectors.toList());
    }
    
    /**
     * 공동구매 수정
     */
    @Transactional
    public GroupBuyingResponse updateGroupBuying(Long id, GroupBuyingUpdateRequest request) {
        GroupBuying groupBuying = groupBuyingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        
        // 수정 로직 (Setter 대신 빌더 패턴으로 재생성하거나, Entity에 수정 메서드 추가 필요)
        // 현재는 간단히 예시로 작성
        
        return GroupBuyingResponse.from(groupBuying);
    }
    
    /**
     * 공동구매 삭제
     */
    @Transactional
    public void deleteGroupBuying(Long id) {
        if (!groupBuyingRepository.existsById(id)) {
            throw new IllegalArgumentException("존재하지 않는 공동구매입니다.");
        }
        groupBuyingRepository.deleteById(id);
    }
    
}
