package com.research.assistant.service;

import com.research.assistant.dto.GeminiResponse;
import com.research.assistant.dto.ResearchRequest;
import com.research.assistant.enums.Operations;
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

        switch(request.getOperation()){
            case Operations.SUMMARIZE -> prompt.append("Provide a clear and concise summary of the following text in a few sentences :\n\n");
            case Operations.SUGGEST -> prompt.append("Based on the following content: suggest related topics and further readings. Format the response with clear headings and bullet points:\n\n");
            default -> throw new IllegalArgumentException("Unknown Operation :"+request.getOperation());
        }

        prompt.append(request.getContent());

        return prompt.toString();
    }
}
