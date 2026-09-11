package com.research.assistant.youtube.controller;

import com.research.assistant.youtube.dto.YoutubeAnswerResponse;
import com.research.assistant.youtube.dto.YoutubeQuestionRequest;
import com.research.assistant.youtube.service.YoutubeRagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/youtube")
@RequiredArgsConstructor
public class YoutubeRagController {
    private final YoutubeRagService youtubeRagService;

    @PostMapping("/ask")
    public ResponseEntity<YoutubeAnswerResponse> askQuestion(@RequestBody YoutubeQuestionRequest request){
        YoutubeAnswerResponse response =youtubeRagService.askQuestion(
                request.videoId(),
                request.question()
        );

        return ResponseEntity.ok(response);
    }
}
