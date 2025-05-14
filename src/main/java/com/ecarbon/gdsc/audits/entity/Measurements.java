package com.ecarbon.gdsc.audits.entity;


import com.ecarbon.gdsc.carbon.dto.Lighthouse.NetworkRequest;
import com.ecarbon.gdsc.carbon.dto.Lighthouse.ResourceSummary;
import com.ecarbon.gdsc.carbon.dto.PlaceInfo;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Getter
@Document(collection = "user_measurements")
public class Measurements {

    @Id
    private String id;

    private String url;

    private String measurementType;

    private String measuredAt;
    private String weekStartDate;

    private PlaceInfo placeInfo;

    private List<NetworkRequest> networkRequests;
    private List<ResourceSummary> resourceSummaries;
    private List<String> requestedUrls;

    private Long totalByteWeight;
    private Long canOptimizeCssBytes;
    private Long canOptimizeJsBytes;
    private Long modernImageFormatsBytes;
    private Long efficientAnimatedContent;
    private Long thirdPartySummaryWastedBytes;
    private Long duplicatedJavascript;
    private Long totalUnusedBytesScript;
    private Long totalResourceBytesScript;

    private double kbWeight;
    private double carbonEmission;
}
