package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.dto.EmissionRequest;
import com.ecarbon.gdsc.carbon.dto.CarbonAnalysisResponse;
import com.ecarbon.gdsc.carbon.dto.Lighthouse.LighthouseData;
import com.ecarbon.gdsc.carbon.dto.Lighthouse.ResourceSummary;
import com.ecarbon.gdsc.carbon.dto.ResourcePercentage;
import com.ecarbon.gdsc.carbon.entity.OptimizationData;
import com.ecarbon.gdsc.carbon.entity.ResourceData;
import com.ecarbon.gdsc.carbon.entity.TrafficData;
import com.ecarbon.gdsc.carbon.repository.OptimizationDataRepository;
import com.ecarbon.gdsc.carbon.repository.ResourceDataRepository;
import com.ecarbon.gdsc.carbon.repository.TrafficDataRepository;
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

    private final OptimizationDataRepository optimizationDataRepository;
    private final ResourceDataRepository resourceDataRepository;
    private final TrafficDataRepository trafficDataRepository;

    private final CarbonCalculator calculator;

    public Optional<CarbonAnalysisResponse> getDataByUrl(String url) {

        try {
            Optional<LighthouseData> data = fetchLighthouseDataFromMongo(url);

            // 최종 결과를 담을 DTO 생성
            CarbonAnalysisResponse.CarbonAnalysisResponseBuilder carbonAnalysisResponseBuilder = CarbonAnalysisResponse.builder()
                    .url(url);

            // optimizationData에서 totalByteWeight가 있으면 탄소 배출량 계산
            if (data.get().getOptimizationData() != null) {

                OptimizationData optimizationData = data.get().getOptimizationData();
                TrafficData trafficData = data.get().getTrafficData();
                double kbWeight = totalByteWeight / 1024.0;
                double carbonEmission = calculateCarbonEmission(kbWeight);
                String grade = calculateGrade(kbWeight);

                carbonAnalysisResponseBuilder
                        .total_byte_weight(totalByteWeight)
                        .carbonEmission(carbonEmission)
                        .kbWeight(kbWeight)
                        .grade(grade);
            }

            // 하나라도 데이터가 있으면 결과 반환
            return Optional.of(carbonAnalysisResponseBuilder.build());

        } catch (Exception e) {
            log.error("Error fetching data for URL: {}", url, e);
            throw new RuntimeException("Error fetching data: " + e.getMessage(), e);
        }
    }

    private Optional<LighthouseData> fetchLighthouseDataFromMongo(String url){

        Optional<OptimizationData> optimizationData = optimizationDataRepository.findByUrl(url);
        Optional<ResourceData> resourceData = resourceDataRepository.findByUrl(url);
        Optional<TrafficData> trafficData = trafficDataRepository.findByUrl(url);

        LighthouseData lighthouseData = LighthouseData.builder()
                .url(url)
                .optimizationData(optimizationData.orElse(null))
                .resourceData(resourceData.orElse(null))
                .trafficData(trafficData.orElse(null))
                .build();

        return Optional.of(lighthouseData);
    }

    private double calculateCarbonEmission(double kbWeight){

        double sizeInGB = kbWeight / (1024.0 * 1024.0);

        EmissionRequest request = EmissionRequest.builder()
                .dataGb(sizeInGB)
                .newVisitorRatio(1.0)
                .returnVisitorRatio(0.0)
                .dataCacheRatio(0.0)
                .greenHostFactor(0.0)
                .build();

        return calculator.estimateEmissionPerPage(request);
    }

    private String calculateGrade(double totalSizeKb){
        if (totalSizeKb <= 272.51) {
            return "A+";
        } else if (totalSizeKb <= 531.15) {
            return "A";
        } else if (totalSizeKb <= 975.85) {
            return "B";
        } else if (totalSizeKb <= 1410.39) {
            return "C";
        } else if (totalSizeKb <= 1875.01) {
            return "D";
        } else if (totalSizeKb <= 2419.56) {
            return "E";
        } else {
            return "F";
        }
    }
}