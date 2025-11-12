package com.stg.sikboo.onboarding.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.stg.sikboo.ingredient.domain.Ingredient;
import com.stg.sikboo.ingredient.domain.IngredientLocation;
import com.stg.sikboo.ingredient.domain.IngredientRepository;
import com.stg.sikboo.member.domain.Member;
import com.stg.sikboo.member.domain.MemberRepository;
import com.stg.sikboo.onboarding.dto.request.OnboardingRequest;
import com.stg.sikboo.onboarding.dto.response.OnboardingResponse;
import com.stg.sikboo.onboarding.util.IngredientAiParser;
import com.stg.sikboo.onboarding.util.IngredientParsing;
import com.stg.sikboo.onboarding.infra.TextSanitizer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final MemberRepository memberRepo;
    private final IngredientRepository ingredientRepo;
    private final IngredientAiParser ingredientAiParser;

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final int DAYS_FRIDGE = 7;   // 냉장고
    private static final int DAYS_FREEZER = 90; // 냉동실
    private static final int DAYS_ROOM = 3;     // 실온

    @Transactional
    public OnboardingResponse submitAll(Long memberId, OnboardingRequest req) {
        Member m = memberRepo.findById(memberId)
            .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다."));

        int inserted = 0;

        if (req == null || req.skip()) {
            // 건너뛰기
            m.setDiseases(new String[]{});
            m.setAllergies(new String[]{});
            log.info("온보딩 건너뛰기: memberId={}", memberId);
        } else {
            // 1) 질병 / 알레르기 (사용자 입력 그대로 저장)
            if (req.profile() != null) {
                var diseases = req.profile().diseases() != null
                        ? req.profile().diseases().toArray(new String[0])
                        : new String[]{};

                var allergies = req.profile().allergies() != null
                        ? req.profile().allergies().toArray(new String[0])
                        : new String[]{};

                m.setDiseases(diseases);
                m.setAllergies(allergies);

                log.info("프로필 저장 - diseases: {}, allergies: {}",
                    diseases.length, allergies.length);
            }

            // 2) 재료 목록 저장 (위치별)
            if (req.ingredients() != null) {
                inserted += saveByLocation(memberId, IngredientLocation.냉장고, req.ingredients().냉장고());
                inserted += saveByLocation(memberId, IngredientLocation.냉동실, req.ingredients().냉동실());
                inserted += saveByLocation(memberId, IngredientLocation.실온, req.ingredients().실온());
            }
        }

        m.setOnboardingCompleted(true);
        log.info("온보딩 완료: memberId={}, 저장된 재료: {}개", memberId, inserted);

        return new OnboardingResponse(true, inserted);
    }

    private int saveByLocation(Long memberId, IngredientLocation loc, List<String> lines) {
        if (lines == null || lines.isEmpty()) return 0;

        log.debug("재료 저장 시작 - 위치: {}, 입력 라인 수: {}", loc, lines.size());

        List<String> aiExtracted = new ArrayList<>();
        for (String line : lines) {
            if (line == null || line.isBlank()) continue;

            String cleanLine = TextSanitizer.sanitize(line);
            if (cleanLine.isEmpty()) continue;

            log.debug("처리 전: [{}]", line);
            log.debug("처리 후: [{}]", cleanLine);

            if (cleanLine.contains(",")) {
                aiExtracted.addAll(IngredientParsing.parseMany(List.of(cleanLine)));
            } else {
                aiExtracted.addAll(ingredientAiParser.extractIngredients(cleanLine));
            }
        }

        if (aiExtracted.isEmpty()) {
            log.debug("추출된 재료 없음 - 위치: {}", loc);
            return 0;
        }

        log.debug("AI 추출 완료 - 위치: {}, 재료 수: {}", loc, aiExtracted.size());

        List<Ingredient> batch = new ArrayList<>();
        LocalDate dueDate = estimateByLocation(loc);
        LocalDateTime dueDateTime = dueDate.atStartOfDay(KST).toLocalDateTime();

        for (String name : aiExtracted) {
            String cleanName = TextSanitizer.sanitize(name);

            if (cleanName.isEmpty()) {
                log.warn("빈 재료명 건너뜀 - 원본: [{}]", name);
                continue;
            }

            log.info("저장할 재료 - 위치: {}, 이름: [{}] (원본: [{}])", loc, cleanName, name);

            Ingredient ing = Ingredient.builder()
                    .memberId(memberId)
                    .ingredientName(cleanName)
                    .location(loc)
                    .due(dueDateTime)
                    .isDueEstimated(true)
                    .build();
            batch.add(ing);
        }

        if (!batch.isEmpty()) {
            ingredientRepo.saveAll(batch);
            log.info("재료 저장 완료 - 위치: {}, 저장 수: {}", loc, batch.size());
        }

        return batch.size();
    }

    private LocalDate estimateByLocation(IngredientLocation loc) {
        int plusDays = switch (loc) {
            case 냉장고 -> DAYS_FRIDGE;
            case 냉동실 -> DAYS_FREEZER;
            case 실온 -> DAYS_ROOM;
        };
        return LocalDate.now(KST).plusDays(plusDays);
    }
}
