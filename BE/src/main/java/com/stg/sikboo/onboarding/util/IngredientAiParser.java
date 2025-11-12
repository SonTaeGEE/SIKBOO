package com.stg.sikboo.onboarding.util;

import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.chat.messages.*;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class IngredientAiParser {

    private final OpenAiChatModel chatModel;

    public IngredientAiParser(OpenAiChatModel chatModel) {
        this.chatModel = chatModel;
    }

    /**
     * AI에게 문장을 넘겨서 식재료 목록을 추출함
     */
    public List<String> extractIngredients(String userInput) {
        if (userInput == null || userInput.isBlank()) return List.of();

        String promptText = """
            사용자가 입력한 문장에서 음식 재료만 목록으로 추출해줘.
            불필요한 단어(예: '재료:', '필요한 것')는 제외하고, 명사 형태로만 반환해.
            출력은 쉼표로 구분된 한 줄짜리 목록 형태로 줘.

            예시 입력: "오늘은 김치찌개 재료로 돼지고기, 김치, 두부, 파, 마늘을 썼어."
            예시 출력: "돼지고기, 김치, 두부, 파, 마늘"

            입력: %s
            """.formatted(userInput);

        Prompt prompt = new Prompt(List.of(new UserMessage(promptText)));
        var response = chatModel.call(prompt);
        String output = response.getResult().getOutput().getContent();

        // AI가 쉼표로 구분된 결과를 주니까 기존 파서로 정리
        return IngredientParsing.parseMany(List.of(output));
    }
}
