package com.stg.sikboo.chat.domain;

import static lombok.AccessLevel.PROTECTED;

import java.time.LocalDateTime;

import com.stg.sikboo.groupbuying.domain.GroupBuying;
import com.stg.sikboo.member.domain.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chat_message")
@Getter
@NoArgsConstructor(access = PROTECTED)
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long messageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupbuying_id", nullable = false)
    private GroupBuying groupBuying;

    // Member 탈퇴 후에도 채팅 기록 보존을 위해 논리적 연결만 유지
    @Column(name = "member_id", nullable = false)
    private Long memberId;
    
    // 작성자 이름 비정규화 (탈퇴 후에도 표시 가능)
    @Column(name = "member_name", nullable = false, length = 50)
    private String memberName;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
