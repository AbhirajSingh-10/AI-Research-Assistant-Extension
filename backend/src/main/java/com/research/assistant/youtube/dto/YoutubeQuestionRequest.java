package com.research.assistant.youtube.dto;

public record YoutubeQuestionRequest(
        String videoId,
        String question
) {
}
