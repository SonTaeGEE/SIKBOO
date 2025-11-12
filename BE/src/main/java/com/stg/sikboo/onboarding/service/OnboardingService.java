package com.stg.sikboo.onboarding.service;

import java.time.LocalDate;
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
import com.stg.sikboo.onboarding.util.IngredientParsing;
import com.stg.sikboo.onboarding.util.NormalizeUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final MemberRepository memberRepo;
    private final IngredientRepository ingredientRepo;

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final int DAYS_FRIDGE = 7;   // 냉장고
    private static final int DAYS_FREEZER = 90; // 냉동실
    private static final int DAYS_ROOM = 3;     // 실온

    @Transactional
    public OnboardingResponse submitAll(Long memberId, OnboardingRequest req) {
        Member m = memberRepo.findById(memberId).orElseThrow();

        int inserted = 0;
        if (req != null && req.skip()) {
            m.setDiseases(new String[]{});  // 빈 배열
            m.setAllergies(new String[]{});
        } else {
            // 1) 프로필
            if (req != null && req.profile() != null) {
                var diseases = NormalizeUtils.normalizeTags(req.profile().diseases());
                var allergies = NormalizeUtils.normalizeTags(req.profile().allergies());
                m.setDiseases(NormalizeUtils.toArray(diseases));
                m.setAllergies(NormalizeUtils.toArray(allergies));
            }
            // 2) 재료
            if (req != null && req.ingredients() != null) {
                inserted += saveByLocation(memberId, IngredientLocation.냉장고, req.ingredients().냉장고());
                inserted += saveByLocation(memberId, IngredientLocation.냉동실, req.ingredients().냉동실());
                inserted += saveByLocation(memberId, IngredientLocation.실온,   req.ingredients().실온());
            }
        }

        m.setOnboardingCompleted(true);
        return new OnboardingResponse(true, inserted);
    }

    private int saveByLocation(Long memberId, IngredientLocation loc, List<String> lines) {
        var parsed = IngredientParsing.parseMany(lines);
        if (parsed.isEmpty()) return 0;

        List<Ingredient> batch = new ArrayList<>();
        for (var p : parsed) {
            LocalDate dueDate = (p.due() != null) ? p.due() : estimateByLocation(loc);
            boolean estimated = (p.due() == null);

            Ingredient ing = Ingredient.builder()
                    .memberId(memberId)
                    .ingredientName(p.name())
                    .location(loc)
                    .due(dueDate.atStartOfDay(KST).toLocalDateTime())
                    .isDueEstimated(estimated)
                    .build();

            batch.add(ing);
        }
        ingredientRepo.saveAll(batch);
        return batch.size();
    }

    private LocalDate estimateByLocation(IngredientLocation loc) {
        int plus = switch (loc) {
            case 냉장고 -> DAYS_FRIDGE;
            case 냉동실 -> DAYS_FREEZER;
            case 실온   -> DAYS_ROOM;
        };
        return LocalDate.now(KST).plusDays(plus);
    }
}
