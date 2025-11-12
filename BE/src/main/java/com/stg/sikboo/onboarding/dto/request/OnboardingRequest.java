package com.stg.sikboo.onboarding.dto.request;

import java.util.List;

public record OnboardingRequest(
        Profile profile,
        Ingredients ingredients,
        boolean skip
) {
    public record Profile(
            List<String> diseases,
            List<String> allergies
    ) {}

    // 위치별 다건 입력
    public record Ingredients(
            List<String> 냉장고,
            List<String> 냉동실,
            List<String> 실온
    ) {}
}
