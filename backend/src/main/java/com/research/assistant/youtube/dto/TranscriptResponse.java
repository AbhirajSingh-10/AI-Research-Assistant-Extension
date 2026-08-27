package com.research.assistant.youtube.dto;

import java.util.List;

public record TranscriptResponse(
        String videoId,
        List<TranscriptSegment> transcript
) {
}
