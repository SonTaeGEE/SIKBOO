package com.stg.sikboo.recipe.presentation;

import com.stg.sikboo.recipe.dto.request.RecipeGenerateRequest;
import com.stg.sikboo.recipe.dto.response.RecipeSuggestionResponse;
import com.stg.sikboo.recipe.service.RecipeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    @PostMapping("/generate")
    public List<RecipeSuggestionResponse> generate(@RequestBody RecipeGenerateRequest req) {
        return recipeService.generateRecipes(req);
    }

    @GetMapping
    public List<RecipeSuggestionResponse> list(@RequestParam Long memberId) {
        return recipeService.getRecipeList(memberId);
    }
}
