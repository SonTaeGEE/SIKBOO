package com.stg.sikboo.chat.service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stg.sikboo.chat.domain.ChatMessage;
import com.stg.sikboo.chat.domain.repository.ChatMessageRepository;
import com.stg.sikboo.chat.dto.request.ChatMessageCreateRequest;
import com.stg.sikboo.chat.dto.response.ChatMessagePageResponse;
import com.stg.sikboo.chat.dto.response.ChatMessageResponse;
import com.stg.sikboo.groupbuying.domain.GroupBuying;
import com.stg.sikboo.groupbuying.domain.repository.GroupBuyingRepository;
import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.member.domain.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatMessageService {
    
    private final ChatMessageRepository chatMessageRepository;
    private final GroupBuyingRepository groupBuyingRepository;
    private final MemberRepository memberRepository;
    
    /**
     * 채팅 메시지 전송
     */
    @Transactional
    public ChatMessageResponse sendMessage(ChatMessageCreateRequest request) {
        // 공동구매 존재 확인
        GroupBuying groupBuying = groupBuyingRepository.findById(request.getGroupBuyingId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 공동구매입니다."));
        
        // 회원 존재 확인 및 이름 가져오기
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        
        // 메시지 생성 (memberName을 비정규화하여 저장)
        ChatMessage chatMessage = ChatMessage.builder()
                .groupBuying(groupBuying)
                .memberId(member.getId())
                .memberName(member.getName())  // 탈퇴 후에도 보존될 이름
                .message(request.getMessage())
                .build();
        
        ChatMessage saved = chatMessageRepository.save(chatMessage);
        
        return ChatMessageResponse.from(saved);
    }
    
    /**
     * 공동구매의 채팅 메시지 개수 조회
     */
    public long countMessagesByGroupBuying(Long groupBuyingId) {
        return chatMessageRepository.countByGroupBuying_GroupBuyingId(groupBuyingId);
    }
    
    /**
     * Cursor-based Pagination으로 채팅 메시지 조회
     * @param groupBuyingId 공동구매 ID
     * @param cursor 커서 (null이면 최신 메시지부터)
     * @param size 페이지 크기
     * @return 페이지네이션된 채팅 메시지
     */
    public ChatMessagePageResponse getMessagesPaginated(Long groupBuyingId, Long cursor, int size) {
        // 1개 더 가져와서 hasMore 판단
        PageRequest pageRequest = PageRequest.of(0, size + 1);
        
        List<ChatMessage> messages;
        if (cursor == null) {
            // 초기 로드: 최신 메시지부터
            messages = chatMessageRepository.findRecentMessages(groupBuyingId, pageRequest);
        } else {
            // 스크롤 업: cursor 이전 메시지
            messages = chatMessageRepository.findMessagesBefore(groupBuyingId, cursor, pageRequest);
        }
        
        // hasMore 판단
        boolean hasMore = messages.size() > size;
        if (hasMore) {
            messages = messages.subList(0, size);
        }
        
        // 메시지 역순 정렬 (오래된 것부터 최신 순으로)
        Collections.reverse(messages);
        
        // nextCursor 계산 (가장 오래된 메시지 ID)
        Long nextCursor = messages.isEmpty() ? null : messages.get(0).getMessageId();
        
        List<ChatMessageResponse> responses = messages.stream()
                .map(ChatMessageResponse::from)
                .collect(Collectors.toList());
        
        return ChatMessagePageResponse.builder()
                .messages(responses)
                .nextCursor(nextCursor)
                .hasMore(hasMore)
                .size(responses.size())
                .build();
    }
}
