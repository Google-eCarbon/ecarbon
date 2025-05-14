package com.ecarbon.gdsc.audits.lighthouse;


import com.ecarbon.gdsc.audits.dto.LighthouseAuditResult;
import com.ecarbon.gdsc.audits.dto.LighthouseOptimizationData;
import com.ecarbon.gdsc.carbon.dto.Lighthouse.NetworkRequest;
import com.ecarbon.gdsc.carbon.dto.Lighthouse.ResourceSummary;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class LighthouseDataExtractor {

    public LighthouseAuditResult extractAll (JsonNode report, String url){

        JsonNode audits = report.get("audits");

        List<ResourceSummary> resourceSummaries = extractResourceSummaries(audits);
        List<NetworkRequest> networkRequests = extractNetworkRequests(audits);
        List<String> requestedUrls = extractRequestedUrlsFromNetworkRequests(networkRequests);
        LighthouseOptimizationData optimizationData = extractOptimizationData(audits, resourceSummaries, url);

        return LighthouseAuditResult.builder()
                .url(url)
                .analyzedAt(LocalDateTime.now())
                .optimizationData(optimizationData)
                .networkRequests(networkRequests)
                .resourceSummaries(resourceSummaries)
                .requestedUrls(requestedUrls)
                .build();
    }


    // 1. OptimizationData 추출자
    private LighthouseOptimizationData extractOptimizationData(JsonNode audits, List<ResourceSummary> resourceSummaries, String url){

        LighthouseOptimizationData data = LighthouseOptimizationData
                .builder()
                .resourceSummaries(resourceSummaries)
                .totalByteWeight(getLongSafe(audits, "total-byte-weight", "numericValue"))
                .canOptimizeCssBytes(getLongSafe(audits, "unused-css-rules", "details", "overallSavingsBytes"))
                .canOptimizeJsBytes(getLongSafe(audits, "unused-javascript", "details", "overallSavingsBytes"))
                .modernImageFormatsBytes(getLongSafe(audits, "modern-image-formats", "details", "overallSavingsBytes"))
                .efficientAnimatedContent(getLongSafe(audits, "efficient-animated-content", "details", "overallSavingsBytes"))
                .thirdPartySummaryWastedBytes(getLongSafe(audits, "third-party-summary", "details", "summary", "wastedBytes"))
                .duplicatedJavascript(getLongSafe(audits, "duplicated-javascript", "numericValue"))
                .totalUnusedBytesScript(sumFieldInNodes(audits, "script-treemap-data", "unusedBytes"))
                .totalResourceBytesScript(sumFieldInNodes(audits, "script-treemap-data", "resourceBytes")).build();

        return data;
    }

    // 2. NetworkRequests 추출자
    private List<NetworkRequest> extractNetworkRequests(JsonNode audits){

        List<NetworkRequest> networkRequests = new ArrayList<>();
        JsonNode items = audits.path("network-requests").path("details").path("items");

        if(items.isArray()){
            for(JsonNode item : items){
                String url = item.path("url").asText("");
                String resourceType = item.path("resourceType").asText("");
                long resourceSize = item.path("resourceSize").asLong(0);
                long transferSize = item.path("transferSize").asLong(0);

                NetworkRequest request = NetworkRequest.builder()
                        .url(url)
                        .resourceType(resourceType)
                        .resourceSize(resourceSize)
                        .transferSize(transferSize).build();

                networkRequests.add(request);
            }
        }
        return networkRequests;
    }

    // 3. ResourceSummaries 추출자
    private List<ResourceSummary> extractResourceSummaries(JsonNode audits){

        List<ResourceSummary> resourceSummaries = new ArrayList<>();
        JsonNode items = audits.path("resource-summary").path("details").path("items");

        if(items.isArray()){
            for(JsonNode item : items){
                String resourceType = item.path("resourceType").asText("");
                long transferSize = item.path("transferSize").asLong(0);

                ResourceSummary summary = ResourceSummary.builder()
                        .resourceType(resourceType)
                        .transferSize(transferSize).build();

                resourceSummaries.add(summary);
            }
        }
        return resourceSummaries;
    }

    private List<String> extractRequestedUrlsFromNetworkRequests(List<NetworkRequest> requests) {
        return requests.stream()
                .map(NetworkRequest::getUrl)
                .collect(Collectors.toList());
    }

    private Long getLongSafe(JsonNode root, String ... path){
        JsonNode current = root;
        for (String key : path) {
            if (current == null || current.isMissingNode()) return null;
            current = current.get(key);
        }
//        log.info("Final value for path " + String.join(" -> ", path) + ": " + current);

        return current != null && current.isNumber() ? current.asLong() : null;
    }

    private long sumFieldInNodes(JsonNode root, String auditKey, String fieldName) {
        JsonNode nodes = root.path(auditKey).path("details").path("nodes");
        long total = 0L;
        if (nodes.isArray()) {
            for (JsonNode node : nodes) {
                total += node.path(fieldName).asLong(0);
            }
        }
        return total;
    }
}
