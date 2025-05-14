package com.ecarbon.gdsc.audits.lighthouse;

import com.ecarbon.gdsc.audits.dto.LighthouseAuditResult;
import com.ecarbon.gdsc.audits.entity.Measurements;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

@AllArgsConstructor
@Slf4j
public class LighthouseWorker {

    private final LighthouseDataExtractor extractor;
    private final LighthouseRunner runner;
    private final LighthouseDataWriter writer;

    private final LinkedBlockingQueue<String> queue;

    public Measurements run() throws InterruptedException {
        String url = queue.poll(1, TimeUnit.SECONDS);
        if (url == null || url.trim().isEmpty()) {
            log.warn("[LIGHTHOUSE/WORKER] ⚠️ Empty URL received or queue is empty.");
            return null;
        }

        try {
            log.info("[LIGHTHOUSE/WORKER] 🌍 Running Lighthouse for URL: {}", url);

            JsonNode originResult = runner.runLighthouseJsonNode(url);
            if (originResult == null) {
                log.warn("[LIGHTHOUSE/WORKER] ❌ Lighthouse result is null - URL: {}", url);
                return null;
            }

            log.info("[LIGHTHOUSE/WORKER] 📥 Lighthouse run completed - URL: {}", url);

            // 데이터 추출
            LighthouseAuditResult auditResult = extractor.extractAll(originResult, url);
            if (auditResult == null) {
                log.warn("[LIGHTHOUSE/WORKER] ❌ Failed to extract data - URL: {}", url);
                return null;
            }

            // 데이터 저장
            Measurements measurements = writer.saveData(auditResult);
            log.info("[LIGHTHOUSE/WORKER] ✅ Data saved successfully - URL: {}", url);

            return measurements;

        } catch (Exception e) {
            log.error("[LIGHTHOUSE/WORKER] ❌ Error occurred while processing URL: {}", url, e);
            return null;
        }
    }
}
