package com.stg.sikboo.ingredient.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AnalyzeTextResponse {
    private List<IngredientItem> items;
}