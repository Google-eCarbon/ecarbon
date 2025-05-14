package com.ecarbon.gdsc.audits.lighthouse;

import com.ecarbon.gdsc.audits.dto.LighthouseAuditResult;
import com.ecarbon.gdsc.audits.entity.FailedUserMeasurements;
import com.ecarbon.gdsc.audits.entity.Measurements;
import com.ecarbon.gdsc.audits.repository.FirebaseUserMeasurementsRepository;
import com.ecarbon.gdsc.audits.util.DateCalculator;
import com.ecarbon.gdsc.carbon.dto.EmissionRequest;
import com.ecarbon.gdsc.carbon.service.CarbonCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;


@Component
@RequiredArgsConstructor
@Slf4j
public class LighthouseDataWriter {

    private final FirebaseUserMeasurementsRepository firebaseUserMeasurementsRepository;
    private final CarbonCalculator carbonCalculator;
    private final DateCalculator dateCalculator;

    /**
     * Lighthouse 측정 결과를 저장
     *
     * @param auditResult Lighthouse 측정 결과
     * @return 저장된 측정 데이터
     * @throws RuntimeException 데이터 저장 실패 시
     */
    public Measurements saveData(LighthouseAuditResult auditResult) {
        String url = auditResult.getUrl();
        LocalDateTime analyzedAt = auditResult.getAnalyzedAt();
        String analyzedAtStr = analyzedAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        try {
            Measurements measurements = convertToMeasurements(auditResult, analyzedAt, analyzedAtStr);
            firebaseUserMeasurementsRepository.save(measurements);
            log.info("[LIGHTHOUSE/WRITER] ✅ Successfully saved measurement data for URL: {}", url);
            return measurements;

        } catch (Exception e) {
            log.error("[LIGHTHOUSE/WRITER] ❌ Failed to save measurement data for URL: {}", url, e);
            saveFailedMeasurement(auditResult, analyzedAt, analyzedAtStr, e);
            throw new RuntimeException("Failed to save measurement data", e);
        }
    }

    /**
     * Lighthouse 측정 결과를 Measurements 엔티티로 변환
     */
    private Measurements convertToMeasurements(LighthouseAuditResult auditResult, LocalDateTime analyzedAt, String analyzedAtStr) {
        double totalByteWeight = auditResult.getOptimizationData().getTotalByteWeight();
        double kbWeight = totalByteWeight / 1024.0;
        double carbonEmission = estimateCarbonEmission(kbWeight);

        return Measurements.builder()
                .url(auditResult.getUrl())
                .measurementType("weekly")
                .measuredAt(analyzedAtStr)
                .weekStartDate(dateCalculator.getMondayAsString(analyzedAt))
                .networkRequests(auditResult.getNetworkRequests())
                .resourceSummaries(auditResult.getResourceSummaries())
                .requestedUrls(auditResult.getRequestedUrls())
                .totalByteWeight(auditResult.getOptimizationData().getTotalByteWeight())
                .canOptimizeCssBytes(auditResult.getOptimizationData().getCanOptimizeCssBytes())
                .canOptimizeJsBytes(auditResult.getOptimizationData().getCanOptimizeJsBytes())
                .modernImageFormatsBytes(auditResult.getOptimizationData().getModernImageFormatsBytes())
                .efficientAnimatedContent(auditResult.getOptimizationData().getEfficientAnimatedContent())
                .thirdPartySummaryWastedBytes(auditResult.getOptimizationData().getThirdPartySummaryWastedBytes())
                .duplicatedJavascript(auditResult.getOptimizationData().getDuplicatedJavascript())
                .totalUnusedBytesScript(auditResult.getOptimizationData().getTotalUnusedBytesScript())
                .totalResourceBytesScript(auditResult.getOptimizationData().getTotalResourceBytesScript())
                .kbWeight(kbWeight)
                .carbonEmission(carbonEmission)
                .build();
    }

    /**
     * 실패한 측정 데이터 저장
     */
    private void saveFailedMeasurement(LighthouseAuditResult auditResult, LocalDateTime analyzedAt, String analyzedAtStr, Exception e) {
        try {
            FailedUserMeasurements failed = FailedUserMeasurements.builder()
                    .url(auditResult.getUrl())
                    .measuredAt(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                    .weekStartDate(analyzedAtStr)
                    .errorMessage(e.getMessage())
                    .build();

            firebaseUserMeasurementsRepository.saveFailedMeasurement(failed);
            log.error("Failed to save measurement data: {}", e.getMessage(), e);
            log.info("[LIGHTHOUSE/WRITER] ℹ️ Saved failed measurement record for URL: {}", auditResult.getUrl());
        } catch (Exception ex) {
            log.error("[LIGHTHOUSE/WRITER] ❌ Failed to save failed measurement record for URL: {}", auditResult.getUrl(), ex);
        }
    }

    private double estimateCarbonEmission(double kbWeight) {

        double sizeInGB = kbWeight / (1024.0 * 1024.0);

        EmissionRequest request = EmissionRequest.builder()
                .dataGb(sizeInGB)
                .newVisitorRatio(1.0)
                .returnVisitorRatio(0.0)
                .dataCacheRatio(0.0)
                .greenHostFactor(0.0)
                .build();

        double emission = carbonCalculator.estimateEmissionPerPage(request);
        return Math.floor(emission * 1000) / 1000.0;
    }
}
