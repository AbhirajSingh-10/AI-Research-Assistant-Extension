package com.research.assistant.youtube.service;

import com.research.assistant.youtube.dto.TranscriptResponse;
import com.research.assistant.youtube.dto.TranscriptSegment;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class YoutubeRagService {

    private final VectorStore vectorStore;

    public void storeTranscripts(TranscriptResponse response){
        List<Document> documents = response.transcript()
                .stream()
                .map(segment -> createDocument(response.videoId(),segment))
                .toList();

        vectorStore.add(documents);
    }

    private Document createDocument(String videoId, TranscriptSegment segment) {

        String content = segment.text();

        return Document.builder()
                .text(content)
                .metadata("videoId", videoId)
                .metadata("start",segment.start())
                .metadata("duration",segment.duration())
                .build();
    }


}
