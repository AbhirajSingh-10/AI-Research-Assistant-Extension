package com.research.assistant.youtube.controller;

import com.research.assistant.youtube.dto.YoutubeQuestionRequest;
import com.research.assistant.youtube.service.YoutubeRagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/youtube")
@RequiredArgsConstructor
public class YoutubeRagController {
    private final YoutubeRagService youtubeRagService;

    @PostMapping("/ask")
    public String askQuestion(@RequestBody YoutubeQuestionRequest request){
        return youtubeRagService.askQuestion(
                request.videoId(),
                request.question()
        );
    }
}
