package com.ecarbon.gdsc.carbon.entity;


import com.ecarbon.gdsc.carbon.dto.Lighthouse.NetworkRequest;
import com.ecarbon.gdsc.carbon.dto.Lighthouse.ResourceSummary;
import com.ecarbon.gdsc.carbon.dto.PlaceInfo;
import com.google.cloud.Timestamp;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Getter
@Document(collection = "weekly_measurements")
public class WeeklyMeasurements {
    @Id
    private String id;

    private String url;

    private String measurementType;

    private String measuredAt;
    private String weekStartDate;

    private PlaceInfo placeInfo;

    private List<NetworkRequest> networkRequests;
    private List<ResourceSummary> resourceSummaries;

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

    public LocalDateTime getMeasuredAtAsDateTime() {
        return LocalDateTime.parse(measuredAt, DateTimeFormatter.ISO_DATE_TIME);
    }
}
