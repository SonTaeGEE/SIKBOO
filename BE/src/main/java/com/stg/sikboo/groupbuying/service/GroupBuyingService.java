package com.stg.sikboo.groupbuying.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stg.sikboo.groupbuying.domain.GroupBuying;
import com.stg.sikboo.groupbuying.domain.GroupBuying.Category;
import com.stg.sikboo.groupbuying.domain.GroupBuying.Status;
import com.stg.sikboo.groupbuying.domain.repository.GroupBuyingRepository;
import com.stg.sikboo.groupbuying.dto.request.GroupBuyingCreateRequest;
import com.stg.sikboo.groupbuying.dto.request.GroupBuyingUpdateRequest;
import com.stg.sikboo.groupbuying.dto.response.GroupBuyingPageResponse;
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
                .status(Status.RECRUITING)
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
        return groupBuyingRepository.findByStatusAndDeadlineAfter(Status.RECRUITING, now).stream()
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
        
        // Entity의 update 메서드 호출 (더티 체킹으로 자동 업데이트)
        groupBuying.update(
                request.getTitle(),
                request.getCategory(),
                request.getTotalPrice(),
                request.getMaxPeople(),
                request.getInfo(),
                request.getPickupLocation(),
                request.getPickupLatitude(),
                request.getPickupLongitude(),
                request.getDeadline()
        );
        
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
    
    /**
     * 통합 필터링 및 페이징 조회 (거리 계산 포함)
     * 
     * @param search 검색어 (제목)
     * @param category 카테고리
     * @param status 상태
     * @param userLat 사용자 위도
     * @param userLng 사용자 경도
     * @param maxDistance 최대 거리 (km)
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @return 페이지네이션된 공동구매 목록 (거리 정보 포함)
     */
    public GroupBuyingPageResponse getGroupBuyingsWithFilters(
            String search,
            Category category,
            Status status,
            Double userLat,
            Double userLng,
            Double maxDistance,
            int page,
            int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        
        Page<Object[]> result = groupBuyingRepository.findWithFiltersAndDistance(
                search, category, status, userLat, userLng, maxDistance, pageable
        );
        
        // Object[] -> GroupBuyingResponse 변환 (거리 정보 포함)
        List<GroupBuyingResponse> content = result.getContent().stream()
                .map(row -> {
                    GroupBuying groupBuying = (GroupBuying) row[0];
                    Double distance = row[1] != null ? ((Number) row[1]).doubleValue() : null;
                    return GroupBuyingResponse.from(groupBuying, distance);
                })
                .collect(Collectors.toList());
        
        return GroupBuyingPageResponse.builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .number(result.getNumber())
                .size(result.getSize())
                .first(result.isFirst())
                .last(result.isLast())
                .hasNext(result.hasNext())
                .build();
    }
    
}
