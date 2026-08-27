package com.research.assistant.youtube.service;

import com.research.assistant.youtube.dto.TranscriptSegment;
import io.github.thoroldvix.api.TranscriptApiFactory;
import io.github.thoroldvix.api.TranscriptContent;
import io.github.thoroldvix.api.TranscriptRetrievalException;
import io.github.thoroldvix.api.YoutubeTranscriptApi;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class YoutubeTranscriptService implements TranscriptService {

    private final YoutubeTranscriptApi youtubeTranscriptApi;

    public YoutubeTranscriptService(){
        this.youtubeTranscriptApi = TranscriptApiFactory.createDefault();
    }
    @Override
    public List<TranscriptSegment> getTranscript(String videoId) throws TranscriptRetrievalException {
        TranscriptContent content = youtubeTranscriptApi.getTranscript(videoId,"en");

        return content.getContent()
                .stream()
                .map(fragment -> new TranscriptSegment(
                        fragment.getText(),
                        fragment.getStart(),
                        fragment.getDur()
                ))
        .toList();
    }
}
