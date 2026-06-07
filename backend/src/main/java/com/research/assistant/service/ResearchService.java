package com.research.assistant.service;

import com.research.assistant.dto.GeminiResponse;
import com.research.assistant.dto.ResearchRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Service
public class ResearchService {

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ResearchService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    public String processContent(ResearchRequest request) {
        String prompt = buildPrompt(request);

        Map<String ,Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text",prompt)
                        })
                }
        );

        String response = webClient.post()
                .uri(geminiApiUrl+geminiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return extractTextFromResponse(response);
    }

    private String extractTextFromResponse(String response) {
        try{
            GeminiResponse geminiResponse = objectMapper.readValue(response,GeminiResponse.class);
            if(geminiResponse.getCandidates() != null && !geminiResponse.getCandidates().isEmpty()){
                GeminiResponse.Candidate firstCandidate = geminiResponse.getCandidates().getFirst();
                if(firstCandidate.getContent() != null && firstCandidate.getContent().getParts() != null && !firstCandidate.getContent().getParts().isEmpty()){
                    return firstCandidate.getContent().getParts().getFirst().getText();
                }
            }
            return "No content fount in response";
        }catch (Exception e){
            return "Error Parsing: "+ e.getMessage();
        }

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
