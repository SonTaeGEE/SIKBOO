package com.stg.sikboo.onboarding.util;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.*;

public class IngredientParsing {
    private static final Pattern DATE1 = Pattern.compile("^(.*?)/(\\d{4}-\\d{2}-\\d{2})$");
    private static final Pattern DATE2 = Pattern.compile("^(.*?)\\((\\d{4}-\\d{2}-\\d{2})\\)$");

    public record Parsed(String name, LocalDate due, boolean explicit) {}

    public static List<Parsed> parseMany(List<String> lines) {
        if (lines == null) return List.of();
        List<Parsed> out = new ArrayList<>();
        for (String line : lines) {
            if (line == null) continue;
            for (String token : line.split("\\s*,\\s*")) {
                token = token.trim();
                if (token.isBlank()) continue;
                out.add(parseOne(token));
            }
        }
        return out;
    }

    private static Parsed parseOne(String token) {
        Matcher m1 = DATE1.matcher(token);
        if (m1.matches()) return new Parsed(m1.group(1).trim(), LocalDate.parse(m1.group(2)), true);
        Matcher m2 = DATE2.matcher(token);
        if (m2.matches()) return new Parsed(m2.group(1).trim(), LocalDate.parse(m2.group(2)), true);
        return new Parsed(token, null, false);
    }
}