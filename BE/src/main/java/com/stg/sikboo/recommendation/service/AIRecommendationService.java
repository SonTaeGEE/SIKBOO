package com.stg.sikboo.recommendation.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stg.sikboo.ingredient.dto.response.IngredientResponseDTO;
import com.stg.sikboo.ingredient.dto.response.PageResponseDTO;
import com.stg.sikboo.ingredient.service.IngredientService;
import com.stg.sikboo.participant.service.ParticipantService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AIRecommendationService {
    
    private final OpenAiChatModel chatModel;
    private final IngredientService ingredientService;
    private final ParticipantService participantService;
    
    /**
     * 사용자 맞춤 일일 추천 메시지 생성
     */
    public String generateDailyRecommendation(Long memberId) {
        try {
            String promptText = buildContextualPrompt(memberId);
            Prompt prompt = new Prompt(new UserMessage(promptText));
            return chatModel.call(prompt).getResult().getOutput().getContent();
        } catch (Exception e) {
            log.error("AI 추천 메시지 생성 실패: memberId={}", memberId, e);
            throw new RuntimeException("AI 추천 메시지 생성에 실패했습니다.", e);
        }
    }
    
    /**
     * 컨텍스트 기반 프롬프트 생성
     */
    private String buildContextualPrompt(Long memberId) {
        StringBuilder context = new StringBuilder();
        
        // 시스템 역할 정의
        context.append("당신은 식재료 관리와 알뜰한 장보기를 도와주는 친절한 AI 어시스턴트입니다.\n\n");
        
        // 현재 시간 컨텍스트
        appendTimeContext(context);
        
        // 사용자 식재료 컨텍스트
        appendIngredientContext(context, memberId);
        
        // 공동구매 참여 컨텍스트
        appendGroupBuyingContext(context, memberId);
        
        // AI 생성 요청 및 제약사항
        appendGenerationRules(context);
        
        return context.toString();
    }
    
    /**
     * 시간 관련 컨텍스트 추가
     */
    private void appendTimeContext(StringBuilder context) {
        LocalDateTime now = LocalDateTime.now();
        int hour = now.getHour();
        DayOfWeek dayOfWeek = now.getDayOfWeek();
        LocalDate today = now.toLocalDate();
        
        context.append("=== 현재 시간 정보 ===\n");
        context.append(String.format("- 요일: %s\n", getDayOfWeekKorean(dayOfWeek)));
        context.append(String.format("- 시간대: %s\n", getTimeOfDay(hour)));
        context.append(String.format("- 날짜: %d월 %d일\n\n", today.getMonthValue(), today.getDayOfMonth()));
    }
    
    /**
     * 식재료 관련 컨텍스트 추가
     */
    private void appendIngredientContext(StringBuilder context, Long memberId) {
        try {
            // 내 식재료 목록 조회 (유통기한 기준 정렬)
            PageResponseDTO<IngredientResponseDTO> result = ingredientService.list(
                memberId, 
                null,  // location 필터 없음
                null,  // 검색어 없음
                0,     // 첫 페이지
                100,   // 최대 100개
                "due", // 유통기한 기준 정렬
                "asc"  // 오름차순 (임박한 것부터)
            );
            
            List<IngredientResponseDTO> ingredients = result.content();
            
            context.append("=== 사용자 식재료 현황 ===\n");
            context.append(String.format("- 총 식재료: %d개\n", ingredients.size()));
            
            // 유통기한 임박 재료 (3일 이내)
            List<String> expiringSoon = ingredients.stream()
                .filter(i -> i.daysLeft() >= 0 && i.daysLeft() <= 3)
                .map(IngredientResponseDTO::ingredientName)
                .limit(3)
                .collect(Collectors.toList());
            
            if (!expiringSoon.isEmpty()) {
                context.append(String.format("- 곧 상할 재료: %s\n", String.join(", ", expiringSoon)));
            }
            
            context.append("\n");
        } catch (Exception e) {
            log.warn("식재료 정보 조회 실패: memberId={}", memberId, e);
            // 재료 정보 없어도 계속 진행
        }
    }
    
    /**
     * 공동구매 관련 컨텍스트 추가
     */
    private void appendGroupBuyingContext(StringBuilder context, Long memberId) {
        try {
            int groupBuyingCount = participantService.getMyParticipatingGroupBuyings(memberId).size();
            context.append(String.format("- 참여 중인 공동구매: %d개\n\n", groupBuyingCount));
        } catch (Exception e) {
            log.warn("공동구매 정보 조회 실패: memberId={}", memberId, e);
            // 공동구매 정보 없어도 계속 진행
        }
    }
    
    /**
     * AI 생성 규칙 및 예시 추가
     */
    private void appendGenerationRules(StringBuilder context) {
        context.append("=== 요청사항 ===\n");
        context.append("위 정보를 바탕으로 사용자에게 도움이 되는 한 줄 메시지를 작성해주세요.\n\n");
        context.append("조건:\n");
        context.append("1. 40자 이내로 작성\n");
        context.append("2. 이모지 1개 포함\n");
        context.append("3. 시간대/요일/계절을 고려한 자연스러운 표현\n");
        context.append("4. 따뜻하고 친근한 말투\n\n");
        context.append("예시:\n");
        context.append("- 아침: \"좋은 아침이에요! 오늘은 뭐 먹을까요? 🌅\"\n");
        context.append("- 저녁: \"퇴근길이네요! 오늘 저녁은 간단하게 어때요? 🌆\"\n");
        context.append("- 주말: \"여유로운 주말! 냉장고 정리하기 딱 좋은 날이에요 🧹\"\n");
        context.append("- 재료 임박: \"양파가 곧 상해요! 오늘 써볼까요? 🧅\"\n");
    }
    
    /**
     * 요일을 한글로 변환
     */
    private String getDayOfWeekKorean(DayOfWeek day) {
        return switch (day) {
            case MONDAY -> "월요일";
            case TUESDAY -> "화요일";
            case WEDNESDAY -> "수요일";
            case THURSDAY -> "목요일";
            case FRIDAY -> "금요일";
            case SATURDAY -> "토요일";
            case SUNDAY -> "일요일";
        };
    }
    
    /**
     * 시간대를 한글로 변환
     */
    private String getTimeOfDay(int hour) {
        if (hour >= 5 && hour < 9) return "아침";
        if (hour >= 9 && hour < 12) return "오전";
        if (hour >= 12 && hour < 14) return "점심";
        if (hour >= 14 && hour < 18) return "오후";
        if (hour >= 18 && hour < 22) return "저녁";
        return "밤";
    }
}
