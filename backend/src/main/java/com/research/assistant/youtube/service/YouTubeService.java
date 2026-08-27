package com.research.assistant.youtube.service;

import com.research.assistant.youtube.dto.TranscriptResponse;
import io.github.thoroldvix.api.TranscriptRetrievalException;
import org.springframework.stereotype.Service;

@Service
public class YouTubeService {
    private final TranscriptService transcriptService;

    public YouTubeService(TranscriptService transcriptService) {
        this.transcriptService = transcriptService;
    }

    public TranscriptResponse getTranscript(String url) throws TranscriptRetrievalException {

        String videoId = extractVideoId(url);

        var transcript = transcriptService.getTranscript(videoId);

        return new TranscriptResponse(videoId, transcript);
    }

    private String extractVideoId(String url) {

        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("YouTube URL cannot be empty");
        }

        if (url.contains("youtube.com/watch?v=")) {

            String videoId = url.substring(
                    url.indexOf("v=") + 2
            );

            int ampersandIndex = videoId.indexOf("&");

            if (ampersandIndex != -1) {
                videoId = videoId.substring(0, ampersandIndex);
            }

            return videoId;
        }

        if (url.contains("youtu.be/")) {

            String videoId = url.substring(
                    url.indexOf("youtu.be/") + 9
            );

            int questionMarkIndex = videoId.indexOf("?");

            if (questionMarkIndex != -1) {
                videoId = videoId.substring(0, questionMarkIndex);
            }

            return videoId;
        }

        throw new IllegalArgumentException(
                "Invalid YouTube URL"
        );
    }
}
