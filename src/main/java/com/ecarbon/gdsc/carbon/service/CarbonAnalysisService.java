package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.dto.Lighthouse.LighthouseData;
import com.ecarbon.gdsc.carbon.dto.Lighthouse.OptimizationData;
import com.ecarbon.gdsc.carbon.dto.Lighthouse.ResourceData;
import com.ecarbon.gdsc.carbon.dto.Lighthouse.TrafficData;
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

    public Optional<LighthouseData> getDataByUrl(String url) {
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

            // 하나라도 데이터가 있으면 결과 반환
            if (optimizationData.isPresent() || resourceData.isPresent() || trafficData.isPresent()) {
                LighthouseData lighthouseData = LighthouseData.builder()
                        .url(url)
                        .optimizationData(optimizationData.orElse(null))
                        .resourceData(resourceData.orElse(null))
                        .trafficData(trafficData.orElse(null))
                        .build();
                return Optional.of(lighthouseData);
            }

            log.warn("No data found for URL: {}", url);
            return Optional.empty();
        } catch (Exception e) {
            log.error("Error fetching data for URL: {}", url, e);
            throw new RuntimeException("Error fetching data: " + e.getMessage(), e);
        }
    }
    }