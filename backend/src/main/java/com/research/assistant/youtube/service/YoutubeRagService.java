package com.research.assistant.youtube.service;

import com.research.assistant.youtube.dto.TranscriptResponse;
import com.research.assistant.youtube.dto.TranscriptSegment;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class YoutubeRagService {

    private final VectorStore vectorStore;
    private final ChatModel chatModel;

    public void storeTranscripts(TranscriptResponse response) {

        List<TranscriptSegment> segments =
                response.transcript();

        List<Document> documents =
                new ArrayList<>();

        StringBuilder chunkText =
                new StringBuilder();

        double chunkStart = 0;
        double chunkDuration = 0;

        int segmentCount = 0;

        for (TranscriptSegment segment : segments) {

            if (segmentCount == 0) {
                chunkStart = segment.start();
            }

            chunkText.append(segment.text())
                    .append(" ");

            chunkDuration += segment.duration();
            segmentCount++;

            if (segmentCount == 10) {

                documents.add(
                        createDocument(
                                response.videoId(),
                                chunkText.toString(),
                                chunkStart,
                                chunkDuration
                        )
                );

                chunkText.setLength(0);
                chunkDuration = 0;
                segmentCount = 0;
            }
        }

        if (segmentCount > 0) {

            documents.add(
                    createDocument(
                            response.videoId(),
                            chunkText.toString(),
                            chunkStart,
                            chunkDuration
                    )
            );
        }
        int batchSize = 100;

        for (int i = 0; i < documents.size(); i += batchSize) {

            int end = Math.min(
                    i + batchSize,
                    documents.size()
            );

            List<Document> batch =
                    documents.subList(i, end);

            vectorStore.add(batch);
        }
    }

    public String askQuestion(String videoId, String question){
        SearchRequest searchRequest = SearchRequest.builder()
                .query(question)
                .topK(5)
                .similarityThreshold(0.5)
                .filterExpression("videoId == '"+videoId+"'")
                .build();

        List<Document> documents = vectorStore.similaritySearch(searchRequest);

        if(documents==null || documents.isEmpty()){
            return "I couldn't find any relevant information in these video.";
        }


        String context = documents.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n\n"));

        String prompt = """
                You are answering questions about a YouTube video.
                
                Use ONLY the transcript context provided below.
    
                If the answer cannot be found in the transcript,
                say that the information is not available in the video.
    
                Transcript context:
                %s
    
                Question:
                %s
                """.formatted(context, question);

        return chatModel.call(prompt);
    }

    private Document createDocument(
            String videoId,
            String text,
            double start,
            double duration
    ) {

        return Document.builder()
                .text(text.trim())
                .metadata("videoId", videoId)
                .metadata("source", "youtube")
                .metadata("start", start)
                .metadata("duration", duration)
                .build();
    }
}
