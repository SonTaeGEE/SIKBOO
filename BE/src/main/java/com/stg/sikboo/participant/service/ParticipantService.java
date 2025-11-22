package com.stg.sikboo.participant.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stg.sikboo.groupbuying.domain.GroupBuying;
import com.stg.sikboo.groupbuying.domain.repository.GroupBuyingRepository;
import com.stg.sikboo.groupbuying.dto.GroupBuyingUpdateMessage;
import com.stg.sikboo.groupbuying.dto.response.GroupBuyingPageResponse;
import com.stg.sikboo.groupbuying.dto.response.GroupBuyingResponse;
import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.member.domain.MemberRepository;
import com.stg.sikboo.participant.dto.response.MyGroupBuyingResponse;
import com.stg.sikboo.participant.dto.request.ParticipantJoinRequest;
import com.stg.sikboo.participant.dto.response.ParticipantResponse;
import com.stg.sikboo.participant.domain.Participant;
import com.stg.sikboo.participant.domain.repository.ParticipantRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ParticipantService {
    
    private final ParticipantRepository participantRepository;
    private final GroupBuyingRepository groupBuyingRepository;
    private final MemberRepository memberRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * 공동구매 참여
     */
    @Transactional
    public ParticipantResponse joinGroupBuying(ParticipantJoinRequest request) {              
        // 1. 공동구매 조회
        GroupBuying groupBuying = groupBuyingRepository.findById(request.getGroupBuyingId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        
        // 2. 회원 조회
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        
        // 3. 이미 참여했는지 확인
        if (participantRepository.existsByGroupBuying_GroupBuyingIdAndMember_Id(
                request.getGroupBuyingId(), request.getMemberId())) {
            throw new IllegalStateException("이미 참여한 공동구매입니다.");
        }
        
        // 4. 마감 여부 확인
        if (groupBuying.getStatus() == GroupBuying.Status.DEADLINE) {
            throw new IllegalStateException("마감된 공동구매입니다.");
        }
        
        // 5. 참여 생성
        Participant participant = Participant.builder()
                .groupBuying(groupBuying)
                .member(member)
                .build();

        // 먼저 participant를 DB에 저장 (ID 생성)
        Participant saved = participantRepository.save(participant);

        // GroupBuying이 저장된 participant를 리스트에 추가하고 상태 관리
        groupBuying.addParticipant(saved);

        // GroupBuying의 변경사항을 DB에 반영
        groupBuyingRepository.save(groupBuying);
        
        // 7. WebSocket으로 특정 공동구매 방에 참여자 추가 알림
        sendParticipantUpdate(groupBuying.getGroupBuyingId(), "PARTICIPANT_JOINED", 
                groupBuying.getCurrentPeople(), groupBuying.getStatus().name(), request.getMemberId());
        
        return ParticipantResponse.from(saved);
    }
    
    /**
     * 공동구매 나가기
     */
    @Transactional
    public void leaveGroupBuying(Long groupBuyingId, Long memberId) {
        // 1. 참여 정보 조회
        Participant participant = participantRepository.findByGroupBuying_GroupBuyingIdAndMember_Id(groupBuyingId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("참여하지 않은 공동구매입니다."));
        
        // 2. 공동구매 조회
        GroupBuying groupBuying = participant.getGroupBuying();
        
        // 3. 주최자는 나갈 수 없음
        if (groupBuying.getMember().getId().equals(memberId)) {
            throw new IllegalStateException("주최자는 공동구매에서 나갈 수 없습니다.");
        }

        // GroupBuying이 participant 제거하고 상태 관리
        groupBuying.removeParticipant(participant);

        // DB에서 participant 삭제
        participantRepository.delete(participant);

        // GroupBuying 변경사항 저장
        groupBuyingRepository.save(groupBuying);
        
        // 6. WebSocket으로 특정 공동구매 방에 참여자 나가기 알림
        sendParticipantUpdate(groupBuying.getGroupBuyingId(), "PARTICIPANT_LEFT", 
                groupBuying.getCurrentPeople(), groupBuying.getStatus().name(), memberId);
    }
    
    /**
     * 특정 공동구매의 참여자 목록 조회
     */
    public List<ParticipantResponse> getParticipantsByGroupBuying(Long groupBuyingId) {
        return participantRepository.findByGroupBuying_GroupBuyingId(groupBuyingId).stream()
                .map(ParticipantResponse::from)
                .collect(Collectors.toList());
    }
    
    /**
     * 내가 참여한 공동구매 목록 조회
     */
    public List<MyGroupBuyingResponse> getMyParticipatingGroupBuyings(Long memberId) {
        return participantRepository.findByMember_Id(memberId).stream()
                .sorted((a, b) -> b.getJoinedAt().compareTo(a.getJoinedAt()))
                .map(p -> MyGroupBuyingResponse.from(p.getGroupBuying(), p.getJoinedAt()))
                .collect(Collectors.toList());
    }
    
    /**
     * 참여 여부 확인
     */
    public boolean isParticipating(Long groupBuyingId, Long memberId) {
        return participantRepository.existsByGroupBuying_GroupBuyingIdAndMember_Id(groupBuyingId, memberId);
    }
    
    /**
     * 참여자 수 조회
     */
    public long countParticipants(Long groupBuyingId) {
        return participantRepository.countByGroupBuying_GroupBuyingId(groupBuyingId);
    }
    
    /**
     * 내가 참여한 공동구매 목록을 필터링 및 페이징 조회
     * 
     * @param memberId 회원 ID
     * @param search 검색어 (제목)
     * @param category 카테고리
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @return 페이지네이션된 공동구매 목록
     */
    public GroupBuyingPageResponse getMyParticipatingGroupBuyingsWithFilters(
            Long memberId,
            String search,
            GroupBuying.Category category,
            int page,
            int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        
        Page<GroupBuying> result = participantRepository.findMyParticipatingGroupBuyingsWithFilters(
                memberId, search, category, pageable
        );
        
        List<GroupBuyingResponse> content = result.getContent().stream()
                .map(GroupBuyingResponse::from)
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
    
    /**
     * WebSocket으로 특정 공동구매 방에 참여자 업데이트 전송
     */
    private void sendParticipantUpdate(Long groupBuyingId, String updateType, Integer currentPeople, String status, Long memberId) {
        GroupBuyingUpdateMessage message = GroupBuyingUpdateMessage.builder()
                .groupBuyingId(groupBuyingId)
                .updateType(updateType)
                .currentPeople(currentPeople)
                .status(status)
                .memberId(memberId)
                .build();
        
        // 특정 공동구매 방으로만 전송
        messagingTemplate.convertAndSend("/topic/groupbuying/" + groupBuyingId + "/participants", message);
    }
}
