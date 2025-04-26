package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.dto.EmissionRequest;
import com.ecarbon.gdsc.carbon.dto.CarbonAnalysisResponse;
import com.ecarbon.gdsc.carbon.dto.CarbonEquivalents;
import com.ecarbon.gdsc.carbon.dto.Lighthouse.LighthouseData;
import com.ecarbon.gdsc.carbon.dto.Lighthouse.ResourceSummary;
import com.ecarbon.gdsc.carbon.dto.ResourcePercentage;
import com.ecarbon.gdsc.carbon.entity.OptimizationData;
import com.ecarbon.gdsc.carbon.entity.ResourceData;
import com.ecarbon.gdsc.carbon.entity.TrafficData;
import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.repository.OptimizationDataRepository;
import com.ecarbon.gdsc.carbon.repository.ResourceDataRepository;
import com.ecarbon.gdsc.carbon.repository.TrafficDataRepository;
import com.ecarbon.gdsc.carbon.repository.WeeklyMeasurementsRepository;
import com.ecarbon.gdsc.carbon.util.CarbonGradeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarbonAnalysisService {

    private final WeeklyMeasurementsRepository weeklyMeasurementsRepository;
    private final CarbonCalculator calculator;

    public Optional<CarbonAnalysisResponse> analyzeCarbonByUrl(String url) {

        try {
            Optional<WeeklyMeasurements> weeklyDataOpt = weeklyMeasurementsRepository.findTopByUrlOrderByMeasuredAtDesc(url);

            if (weeklyDataOpt.isEmpty()) {
                return Optional.empty();
            }
            WeeklyMeasurements weeklyData = weeklyDataOpt.get();

            CarbonAnalysisResponse.CarbonAnalysisResponseBuilder carbonAnalysisResponseBuilder
                    = CarbonAnalysisResponse.builder().url(url);

            if (weeklyData.getTotalByteWeight() != null) {
                long totalByteWeight = weeklyData.getTotalByteWeight();
                double kbWeight = weeklyData.getKbWeight();
                double carbonEmission = weeklyData.getCarbonEmission();

                List<ResourcePercentage> resourcePercentages = calculateResourcePercentages(weeklyData.getResourceSummaries());
                CarbonEquivalents equivalents = calculateCarbonEquivalents(carbonEmission);
                String grade = CarbonGradeUtil.calculateGrade(totalByteWeight);

                carbonAnalysisResponseBuilder
                        .total_byte_weight(totalByteWeight)
                        .resourcePercentage(resourcePercentages)
                        .carbonEquivalents(equivalents)
                        .carbonEmission(carbonEmission)
                        .globalAvgCarbon(0.8)
                        .kbWeight(kbWeight)
                        .grade(grade)
                        .build();
            }

            return Optional.of(carbonAnalysisResponseBuilder.build());

        } catch (Exception e) {
            log.error("Error fetching data for URL: {}", url, e);
            throw new RuntimeException("Error fetching data: " + e.getMessage(), e);
        }
    }

    private List<ResourcePercentage> calculateResourcePercentages(List<ResourceSummary> resourceSummaries){

        Optional<ResourceSummary> totalSummaryOpt = resourceSummaries.stream()
                .filter(rs -> "total".equalsIgnoreCase(rs.getResourceType()))
                .findFirst();

        if (totalSummaryOpt.isEmpty() || totalSummaryOpt.get().getTransferSize() == 0) {
            return Collections.emptyList();
        }

        long totalSize = totalSummaryOpt.get().getTransferSize();

        return resourceSummaries.stream()
                .filter(rs -> !"total".equalsIgnoreCase(rs.getResourceType())) // total은 제외
                .map(rs -> ResourcePercentage.builder()
                        .resourceType(rs.getResourceType())
                        .size(rs.getTransferSize())
                        .percentage((rs.getTransferSize() * 100.0) / totalSize)
                        .build())
                .collect(Collectors.toList());
    }

    private CarbonEquivalents calculateCarbonEquivalents(double carbonEmission){

        double factor = carbonEmission / 1000 * 10000  * 12;

        return CarbonEquivalents.builder()
                .coffeeCups(Math.round(factor / 0.01 * 1))
                .evKm(Math.round(factor / 0.16 * 2))
                .phoneCharges(Math.round(factor / 0.02 * 3))
                .trees(Math.round(factor / 0.02 * 1))
                .build();
    }

}