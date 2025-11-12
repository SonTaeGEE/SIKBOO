package com.stg.sikboo.onboarding.util;

import java.text.Normalizer;
import java.util.*;

public class NormalizeUtils {
    private static final Map<String,String> SYN = Map.of(
        "위암","암","캔서","암","알러지","알레르기"
    );

    public static List<String> normalizeTags(Collection<String> raw) {
        if (raw == null) return List.of();
        return raw.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .map(s -> Normalizer.normalize(s, Normalizer.Form.NFKC))
                .map(String::toLowerCase)
                .map(s -> SYN.getOrDefault(s, s))
                .filter(s -> !s.isBlank())
                .distinct()
                .toList();
    }

    public static String[] toArray(Collection<String> list) {
        return list == null ? new String[]{} : list.toArray(String[]::new);
    }

    public static String normKey(String s) {
        if (s == null) return "";
        String t = Normalizer.normalize(s, Normalizer.Form.NFKC);
        t = t.toLowerCase(Locale.ROOT);
        return t.replaceAll("\\s+","");
    }
}