package com.ecarbon.gdsc.tools.lighthouse_website_audit.lighthouse;

import com.ecarbon.gdsc.tools.lighthouse_website_audit.dto.*;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

@Slf4j
public class LighthouseParser {
    public static LighthouseResultDto parseLighthouseResult(String json, String url) {
        try {
            log.info("📥 Lighthouse JSON 파싱 시작 - URL: {}", url);

            ObjectMapper objectMapper = new ObjectMapper();

            log.debug("📌 입력 JSON 내용: {}", json != null && json.length() > 500 ? json.substring(0, 500) + "..." : json);

            JsonNode root = objectMapper.readTree(json);
            JsonNode audits = root.path("audits");

            log.debug("✅ JSON 파싱 성공 - audits 필드 추출 완료");

            // 네트워크 요청 데이터 추출
            List<NetworkRequestDto> networkRequests = new ArrayList<>();
            JsonNode networkRequestsNode = audits
                    .path("network-requests")
                    .path("details")
                    .path("items");
            if (networkRequestsNode.isArray()) {
                for (JsonNode node : networkRequestsNode) {
                    networkRequests.add(new NetworkRequestDto(
                            node.path("url").asText(),
                            node.path("resourceType").asText(),
                            node.path("resourceSize").asLong(),
                            node.path("transferSize").asLong(),
                            node.path("statusCode").asInt(),
                            node.path("protocol").asText()
                    ));
                }
                log.debug("✅ 네트워크 요청 데이터 {}개 추출 완료", networkRequests.size());
            } else {
                log.warn("⚠️ 네트워크 요청 데이터가 배열 형식이 아님");
            }

            // 리소스 요약 데이터 추출
            List<ResourceSummaryDto> resourceSummary = new ArrayList<>();
            JsonNode resourceSummaryNode = audits
                    .path("resource-summary")
                    .path("details")
                    .path("items");
            if (resourceSummaryNode.isArray()) {
                for (JsonNode node : resourceSummaryNode) {
                    resourceSummary.add(new ResourceSummaryDto(
                            node.path("resourceType").asText(),
                            node.path("requestCount").asInt(),
                            node.path("transferSize").asLong()
                    ));
                }
                log.debug("✅ 리소스 요약 데이터 {}개 추출 완료", resourceSummary.size());
            } else {
                log.warn("⚠️ 리소스 요약 데이터가 배열 형식이 아님");
            }

            // 미사용 데이터 추출
            UnusedDataDto unusedData = new UnusedDataDto(
                    url,
                    extractUnusedData(audits.path("unused-javascript")),
                    extractUnusedData(audits.path("unused-css-rules")),
                    extractUnusedData(audits.path("modern-image-formats"))
            );

            log.info("🎯 Lighthouse 파싱 완료 - URL: {}", url);
            return new LighthouseResultDto(url, networkRequests, resourceSummary, unusedData);

        } catch (JsonParseException e) {
            log.warn("❌ JSON 형식 오류 - URL: {} | 오류 위치: {}", url, e.getLocation());
        } catch (JsonMappingException e) {
            log.warn("❌ JSON 매핑 오류 - URL: {}", url);
        } catch (JsonProcessingException e) {
            log.warn("❌ JSON 처리 중 오류 - URL: {}", url);
        } catch (Exception e) {
            log.error("🚨 Lighthouse 결과 JSON 파싱 실패 - URL: {} | 원인: {}", url, e.getMessage());
        }

        log.debug("🔍 오류 발생 시 JSON 일부: {}", json.length() > 500 ? json.substring(0, 500) + "..." : json);
        return null;
    }

    // 미사용 데이터 추출 메서드
    private static UnusedMetricDto extractUnusedData(JsonNode auditNode) {
        if (auditNode == null || auditNode.isMissingNode()) {
            log.warn("⚠️ 미사용 데이터가 없음 (기본값 반환)");
            return new UnusedMetricDto("", 0.0);
        }
        return new UnusedMetricDto(
                auditNode.path("displayValue").asText(""),
                auditNode.path("numericValue").asDouble(0.0)
        );
    }
}
