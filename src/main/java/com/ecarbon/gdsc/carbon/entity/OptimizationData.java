package com.ecarbon.gdsc.carbon.entity;


import com.ecarbon.gdsc.carbon.dto.Lighthouse.ResourceSummary;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "optimization_data")
@Builder
@Getter
@ToString
public class OptimizationData {
    @Id
    private String id;

    private List<ResourceSummary> resourceSummaries;

    private Long totalByteWeight;               // 'total-byte-weight', 'numericValue'

    private Long canOptimizeCssBytes;           // 'unused-css-rules', 'details', 'overallSavingsBytes'
    private Long canOptimizeJsBytes;            // 'unused-javascript', 'details', 'overallSavingsBytes'

    private Long modernImageFormatsBytes;       // 'modern-image-formats', 'details', 'overallSavingsBytes'
    private Long efficientAnimatedContent;      // 'efficient-animated-content', 'details', 'overallSavingsBytes'
    private Long thirdPartySummaryWastedBytes;  // 'third-party-summary', 'details', 'summary', 'wastedBytes'
    private Long duplicatedJavascript;          // 'duplicated-javascript', 'numericValue'

    private Long totalUnusedBytesScript;        // 'script-treemap-data', 'details', 'nodes' -> sum(node.get('unusedBytes', 0)
    private Long totalResourceBytesScript;      // 'script-treemap-data', 'details', 'nodes' -> sum(node.get('resourceBytes', 0)

    private String url;
    private String analyzedAt;
}

