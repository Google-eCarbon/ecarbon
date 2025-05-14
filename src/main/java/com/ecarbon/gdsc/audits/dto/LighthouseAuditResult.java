package com.ecarbon.gdsc.audits.dto;

import com.ecarbon.gdsc.carbon.dto.Lighthouse.NetworkRequest;
import com.ecarbon.gdsc.carbon.dto.Lighthouse.ResourceSummary;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@ToString
public class LighthouseAuditResult {

    private String url;
    private LocalDateTime analyzedAt;

    private LighthouseOptimizationData optimizationData;
    private List<NetworkRequest> networkRequests;
    private List<ResourceSummary> resourceSummaries;
    private List<String> requestedUrls;
}
