package com.stg.sikboo.onboarding.util;

import java.util.ArrayList;
import java.util.List;

import com.stg.sikboo.onboarding.infra.TextSanitizer;

public class IngredientParsing {

    /** 쉼표 구분 입력을 토큰으로 나누고 각 토큰을 sanitize */
    public static List<String> parseMany(List<String> lines) {
        if (lines == null) return List.of();

        List<String> result = new ArrayList<>();

        for (String line : lines) {
            if (line == null || line.isBlank()) continue;

            String cleanLine = TextSanitizer.sanitize(line);
            if (cleanLine.isEmpty()) continue;

            String[] tokens = cleanLine.split("\\s*,\\s*");
            for (String token : tokens) {
                String cleanToken = TextSanitizer.sanitize(token);
                if (!cleanToken.isEmpty()) {
                    result.add(cleanToken);
                }
            }
        }

        return result;
    }
}
