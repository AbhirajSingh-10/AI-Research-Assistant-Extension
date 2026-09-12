package com.research.assistant.service;



import com.research.assistant.dto.ResearchRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class ResearchService {

    @Value("${spring.ai.ollama.base-url}")
    private String ollamaApi;

    private final ChatModel chatModel;


    public String processContent(ResearchRequest request) {
        String promptText = buildPrompt(request);

        Prompt prompt = new Prompt(promptText);

        return chatModel
                .call(prompt)
                .getResult()
                .getOutput()
                .getText();

    }

    private String buildPrompt(ResearchRequest request){
        StringBuilder prompt = new StringBuilder();

        switch (request.getOperation()) {
            case SUMMARIZE -> prompt.append("""
        You are an elite research assistant. Provide a concise, high-density summary of the text below.
        - Capture the core argument, thesis, or primary finding in 2-3 sentences.
        - Follow with a brief bulleted list of essential supporting context if necessary.
        - Avoid meta-commentary (do NOT say "Here is a summary").
        
        Text to summarize:
        """);

            case SUGGEST -> prompt.append("""
        Analyze the following text and suggest 3-4 advanced topics or adjacent fields for further research.
        - For each topic, provide a brief 1-sentence explanation of why it is relevant.
        - Format the response with clear markdown headings (###) and clean bullet points.
        - Avoid meta-commentary.
        
        Text to analyze:
        """);

            case EXPLAIN -> prompt.append("""
        Act as an expert educator. Explain the complex concepts in the text below using simple, clear, and accessible language.
        - Deconstruct technical jargon or academic phrases.
        - If applicable, use a brief, intuitive analogy to ground the explanation.
        - Keep the tone professional yet easy to understand for a non-expert.
        - Avoid meta-commentary.
        
        Text to explain:
        """);

            case KEY_POINTS -> prompt.append("""
        Extract the absolute most critical takeaways from the text below.
        - Limit the output to a maximum of 5 high-impact bullet points.
        - Order them by logical importance.
        - Start each bullet point with a bold **Key Phrase** summarizing the point.
        - Avoid meta-commentary.
        
        Text to parse:
        """);

            case GENERATE_NOTES -> prompt.append("""
        Transform the text below into structured, highly organized study notes.
        - Use a clean hierarchical outline layout (Headings, Subheadings, and Nested Bullets).
        - Explicitly isolate and define any key terms, formulas, names, or critical dates.
        - Optimize the layout to be easily skimmable for future review.
        - Avoid meta-commentary.
        
        Text to format into notes:
        """);

            default -> throw new IllegalArgumentException("Unknown Operation: " + request.getOperation());
        }

        prompt.append(request.getContent());

        return prompt.toString();
    }
}
