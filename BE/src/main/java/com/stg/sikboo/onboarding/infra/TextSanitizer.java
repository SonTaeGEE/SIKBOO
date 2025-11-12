package com.stg.sikboo.onboarding.infra;

import java.text.Normalizer;
import java.util.regex.Pattern;

/**
 * 텍스트 정제 유틸:
 * - 전각/호환 정규화(NFKC)
 * - 제로폭/형식 문자 제거
 * - 인용부호/유사 인용/괄호류 제거
 * - 공백 정리
 */
public final class TextSanitizer {
    private TextSanitizer() {}

    // 모든 인용부호 범주 + 흔한 유사 문자(프라임, 길리메, 일본 괄호 등)
    private static final Pattern QUOTE_OR_BRACKETS = Pattern.compile(
        "[\\p{Pi}\\p{Pf}\"'`´＂＇“”„‟‚‘’ˮ′″‵‶«»‹›「」『』〈〉《》【】〔〕﹁﹂﹃﹄❛❜❝❞〝〞〃]"
    );
    // 형식 문자(Cf) + 제로폭들
    private static final Pattern FORMAT_OR_ZERO_WIDTH = Pattern.compile("[\\p{Cf}\\u200B-\\u200D\\uFEFF]");
    // 모든 유니코드 공백(분리불가 공백 포함)
    private static final Pattern ALL_SPACES = Pattern.compile("[\\p{Z}\\s]+");

    public static String sanitize(String s) {
        if (s == null) return "";
        String t = Normalizer.normalize(s, Normalizer.Form.NFKC);
        t = FORMAT_OR_ZERO_WIDTH.matcher(t).replaceAll("");
        t = QUOTE_OR_BRACKETS.matcher(t).replaceAll("");
        t = ALL_SPACES.matcher(t).replaceAll(" ").trim();
        return t;
    }
}
