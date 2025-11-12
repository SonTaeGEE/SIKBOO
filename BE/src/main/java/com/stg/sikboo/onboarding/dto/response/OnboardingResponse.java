package com.stg.sikboo.onboarding.dto.response;

public record OnboardingResponse(
        boolean onboardingCompleted,
        int insertedIngredients
) {}