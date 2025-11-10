package com.stg.sikboo.ingredient.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum IngredientLocation {
    냉장고("냉장고"),
    냉동실("냉동실"),
    실온("실온");

    private final String label;

    IngredientLocation(String label) {
        this.label = label;
    }

    @JsonValue // 클라이언트에 응답 시 문자열로 변환 ("냉장고" 등)
    public String getLabel() {
        return label;
    }

    @JsonCreator // 클라이언트에서 "냉장고" 같은 문자열로 보내면 Enum으로 역변환
    public static IngredientLocation from(String value) {
        for (IngredientLocation loc : values()) {
            if (loc.label.equals(value)) {
                return loc;
            }
        }
        throw new IllegalArgumentException("Unknown location: " + value);
    }

    @Override
    public String toString() {
        return label;
    }
}
