package com.research.assistant.youtube.controller;

import com.research.assistant.youtube.dto.TranscriptResponse;
import com.research.assistant.youtube.dto.YoutubeRequest;
import com.research.assistant.youtube.service.YouTubeService;
import io.github.thoroldvix.api.TranscriptRetrievalException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/youtube")
@RequiredArgsConstructor
public class YoutubeController {

    private final YouTubeService youTubeService;

    @PostMapping("/transcript")
    public ResponseEntity<TranscriptResponse> getTranscript(
            @RequestBody YoutubeRequest request
    ) throws TranscriptRetrievalException {

        TranscriptResponse response = youTubeService.getTranscript(request.url());

        return ResponseEntity.ok(response);
    }

}
