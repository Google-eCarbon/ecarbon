package com.ecarbon.gdsc.audits.dto;

import com.ecarbon.gdsc.carbon.dto.Lighthouse.ResourceSummary;
import lombok.*;
import java.util.List;

@Builder
@Getter
@ToString
public class LighthouseOptimizationData {

    private List<ResourceSummary> resourceSummaries; //

    private Long totalByteWeight;               // 'total-byte-weight', 'numericValue'


    private Long canOptimizeCssBytes;           // 'unused-css-rules', 'details', 'overallSavingsBytes'
    private Long canOptimizeJsBytes;            // 'unused-javascript', 'details', 'overallSavingsBytes'

    private Long modernImageFormatsBytes;       // 'modern-image-formats', 'details', 'overallSavingsBytes'
    private Long efficientAnimatedContent;      // 'efficient-animated-content', 'details', 'overallSavingsBytes'
    private Long thirdPartySummaryWastedBytes;  // 'third-party-summary', 'details', 'summary', 'wastedBytes'
    private Long duplicatedJavascript;          // 'duplicated-javascript', 'numericValue'

    private Long totalUnusedBytesScript;        // 'script-treemap-data', 'details', 'nodes' -> sum(node.get('unusedBytes', 0)
    private Long totalResourceBytesScript;      // 'script-treemap-data', 'details', 'nodes' -> sum(node.get('resourceBytes', 0)
}
