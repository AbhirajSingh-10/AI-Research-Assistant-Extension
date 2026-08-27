package com.research.assistant.youtube.dto;

public record TranscriptSegment(
        String text,
        Double start,
        Double duration
) {
}
