package com.research.assistant.youtube.dto;

import java.util.List;

public record YoutubeAnswerResponse(
        String answer,
        List<Source> sourceList
) {
    public record Source(
            double start,
            double duration,
            String text

    ){

    }
}
