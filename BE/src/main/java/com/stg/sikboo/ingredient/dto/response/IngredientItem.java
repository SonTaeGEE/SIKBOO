package com.stg.sikboo.ingredient.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IngredientItem {
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("storage")
    private String storage;
    
    @JsonProperty("expiryDays")
    private int expiryDays;
    
    // ✅ Getter 오버라이드 (따옴표 제거)
    public String getName() {
        return cleanString(name);
    }
    
    public String getStorage() {
        return cleanString(storage);
    }
    
    private String cleanString(String str) {
        if (str == null) return "";
        return str.trim()
            .replace("\"", "")
            .replace("'", "")
            .replaceAll("\\s+", " ")
            .trim();
    }
}