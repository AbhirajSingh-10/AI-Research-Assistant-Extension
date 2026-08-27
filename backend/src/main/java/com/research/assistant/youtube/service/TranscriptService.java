package com.research.assistant.youtube.service;

import com.research.assistant.youtube.dto.TranscriptSegment;
import io.github.thoroldvix.api.TranscriptRetrievalException;

import java.util.List;

public interface TranscriptService {
    List<TranscriptSegment> getTranscript(String videoId) throws TranscriptRetrievalException;
}
