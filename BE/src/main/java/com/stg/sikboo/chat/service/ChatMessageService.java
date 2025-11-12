package com.stg.sikboo.chat.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stg.sikboo.chat.domain.ChatMessage;
import com.stg.sikboo.chat.domain.repository.ChatMessageRepository;
import com.stg.sikboo.chat.dto.request.ChatMessageCreateRequest;
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
     * 공동구매의 채팅 메시지 목록 조회
     */
    public List<ChatMessageResponse> getMessagesByGroupBuying(Long groupBuyingId) {
        List<ChatMessage> messages = chatMessageRepository.findByGroupBuying_GroupBuyingIdOrderByCreatedAt(groupBuyingId);
        return messages.stream()
                .map(ChatMessageResponse::from)
                .collect(Collectors.toList());
    }
    
    /**
     * 공동구매의 채팅 메시지 개수 조회
     */
    public long countMessagesByGroupBuying(Long groupBuyingId) {
        return chatMessageRepository.countByGroupBuying_GroupBuyingId(groupBuyingId);
    }
}
