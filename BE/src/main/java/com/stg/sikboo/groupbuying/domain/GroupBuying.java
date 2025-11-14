package com.stg.sikboo.groupbuying.domain;

import static lombok.AccessLevel.PROTECTED;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.stg.sikboo.chat.domain.ChatMessage;
import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.participant.domain.Participant;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "groupbuying")
@Getter
@NoArgsConstructor(access = PROTECTED)
@AllArgsConstructor
@Builder
public class GroupBuying {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "groupbuying_id")
    private Long groupBuyingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private Category category;

    @Column(name = "total_price", nullable = false)
    private Integer totalPrice;

    @Column(name = "max_people", nullable = false)
    private Integer maxPeople;
    
    @Column(name = "info", nullable = true)
    private String info;

    // currentPeople은 DB 컬럼이지만, participants 리스트의 크기로 자동 계산
    @Column(name = "current_people", nullable = false)
    private Integer currentPeople;
    
    @Column(name = "pickup_location", nullable = false, length = 255)
    private String pickupLocation;

    @Column(name = "pickup_latitude", nullable = false, precision = 10, scale = 8)
    private BigDecimal pickupLatitude;

    @Column(name = "pickup_longitude", nullable = false, precision = 11, scale = 8)
    private BigDecimal pickupLongitude;

    @Column(name = "deadline", nullable = false)
    private LocalDateTime deadline;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    @OneToMany(mappedBy = "groupBuying", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChatMessage> chatMessages = new ArrayList<>();

    @OneToMany(mappedBy = "groupBuying", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Participant> participants = new ArrayList<>();

    // 실제 참여자 수를 계산하는 메서드 (participants 리스트 기반)
    public Integer calculateCurrentPeople() {
        return this.participants != null ? this.participants.size() : 0;
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (currentPeople == null) {
            currentPeople = 0;
        }
        if (status == null) {
            status = Status.RECRUITING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        // participants 리스트 기반으로 currentPeople 자동 동기화
        this.currentPeople = calculateCurrentPeople();
        // 상태 자동 업데이트는 increaseCurrentPeople/decreaseCurrentPeople에서만 수행
        // (closeByDeadline 등 다른 상태 변경을 방해하지 않도록)
    }

    public enum Category {
        FRUIT, VEGETABLE, MEAT, SEAFOOD, DAIRY, ETC
    }

    public enum Status {
        RECRUITING, DEADLINE
    }

    // 비즈니스 로직 메서드
    public void increaseCurrentPeople() {
        this.currentPeople++;
        if (this.currentPeople >= this.maxPeople) {
            this.status = Status.DEADLINE;
        }
    }

    public void decreaseCurrentPeople() {
        if (this.currentPeople > 1) {
            this.currentPeople--;
            if (this.status == Status.DEADLINE) {
                this.status = Status.RECRUITING;
            }
        }
    }
    
    /**
     * 마감 시간이 지나서 자동으로 마감 처리
     */
    public void closeByDeadline() {
        if (this.status == Status.RECRUITING) {
            this.status = Status.DEADLINE;
        }
    }
    
    /**
     * 현재 모집 중인지 확인 (마감시간도 체크)
     */
    public boolean isRecruiting() {
        return this.status == Status.RECRUITING && 
               this.deadline.isAfter(LocalDateTime.now());
    }
    
    /**
     * 공동구매 정보 수정
     * 주최자만 수정 가능하며, 이미 참여한 인원보다 최대 인원을 적게 설정할 수 없음
     */
    public void update(
            String title,
            Category category,
            Integer totalPrice,
            Integer maxPeople,
            String info,
            String pickupLocation,
            BigDecimal pickupLatitude,
            BigDecimal pickupLongitude,
            LocalDateTime deadline) {
        
        // 최대 인원 검증: 현재 참여 인원보다 적을 수 없음
        if (maxPeople < this.currentPeople) {
            throw new IllegalArgumentException(
                String.format("최대 인원은 현재 참여 인원(%d명)보다 작을 수 없습니다.", this.currentPeople)
            );
        }
        
        this.title = title;
        this.category = category;
        this.totalPrice = totalPrice;
        this.maxPeople = maxPeople;
        this.info = info;
        this.pickupLocation = pickupLocation;
        this.pickupLatitude = pickupLatitude;
        this.pickupLongitude = pickupLongitude;
        this.deadline = deadline;
        
        // 최대 인원 도달 시 상태 변경
        if (this.currentPeople >= this.maxPeople) {
            this.status = Status.DEADLINE;
        } else {
            // 최대 인원을 늘려서 여유가 생긴 경우 다시 모집중으로 변경
            if (this.status == Status.DEADLINE) {
                this.status = Status.RECRUITING;
            }
        }
    }
}
