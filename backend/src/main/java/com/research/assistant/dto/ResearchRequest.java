package com.research.assistant.dto;

import com.research.assistant.enums.Operations;
import lombok.Data;

@Data
public class ResearchRequest {
    private String content;
    private Operations operation;
}
