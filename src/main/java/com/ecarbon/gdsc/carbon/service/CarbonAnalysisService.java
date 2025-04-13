package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.dto.EmissionRequest;
import com.ecarbon.gdsc.carbon.dto.ViewData;
import com.ecarbon.gdsc.carbon.entity.OptimizationData;
import com.ecarbon.gdsc.carbon.entity.ResourceData;
import com.ecarbon.gdsc.carbon.entity.TrafficData;
import com.ecarbon.gdsc.carbon.repository.OptimizationDataRepository;
import com.ecarbon.gdsc.carbon.repository.ResourceDataRepository;
import com.ecarbon.gdsc.carbon.repository.TrafficDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarbonAnalysisService {

    private final OptimizationDataRepository optimizationDataRepository;
    private final ResourceDataRepository resourceDataRepository;
    private final TrafficDataRepository trafficDataRepository;

    private final CarbonCalculator calculator;

    public Optional<ViewData> getDataByUrl(String url) {
        log.info("Fetching data for URL: {}", url);

        try {
            // 각 데이터를 개별적으로 조회
            Optional<OptimizationData> optimizationData = optimizationDataRepository.findByUrl(url);
            Optional<ResourceData> resourceData = resourceDataRepository.findByUrl(url);
            Optional<TrafficData> trafficData = trafficDataRepository.findByUrl(url);

            // 데이터 존재 여부 로깅
            log.debug("Optimization data present: {}", optimizationData.isPresent());
            log.debug("Resource data present: {}", resourceData.isPresent());
            log.debug("Traffic data present: {}", trafficData.isPresent());

            // 최종 결과를 담을 DTO 생성
            ViewData.ViewDataBuilder viewDataBuilder = ViewData.builder()
                    .url(url);

            // optimizationData에서 totalByteWeight가 있으면 탄소 배출량 계산
            if (optimizationData.isPresent()) {
                long totalByteWeight = optimizationData.get().getTotalByteWeight();
                double kbWeight = totalByteWeight / 1024.0;
                double carbonEmission = calculateCarbonEmission(kbWeight);
                String grade = calculateGrade(kbWeight);

                viewDataBuilder
                        .total_byte_weight(totalByteWeight)
                        .carbonEmission(carbonEmission)
                        .kbWeight(kbWeight)
                        .grade(grade);
            }

            // 하나라도 데이터가 있으면 결과 반환
            return Optional.of(viewDataBuilder.build());

        } catch (Exception e) {
            log.error("Error fetching data for URL: {}", url, e);
            throw new RuntimeException("Error fetching data: " + e.getMessage(), e);
        }
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