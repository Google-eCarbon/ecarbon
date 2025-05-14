package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.audits.entity.Measurements;
import com.ecarbon.gdsc.audits.repository.FirebaseUserMeasurementsRepository;
import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.repository.FirebaseWeeklyMeasurementRepository;
import com.ecarbon.gdsc.carbon.util.DateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class HomeService {

    private final FirebaseWeeklyMeasurementRepository firebaseWeeklyMeasurementRepository;
    private final FirebaseUserMeasurementsRepository firebaseUserMeasurementsRepository;

    public Optional<WeeklyMeasurements> findByUrl(String url) {
        List<String> normalizedUrls = normalizeUrl(url);
        WeeklyMeasurements latestWeeklyMeasurement = null;

        // 1. WeeklyMeasurements에서 먼저 검색
        for (String normalizedUrl : normalizedUrls) {
            try {
                List<WeeklyMeasurements> measurements = firebaseWeeklyMeasurementRepository.findAllByUrl(normalizedUrl);
                if (!measurements.isEmpty()) {
                    latestWeeklyMeasurement = measurements.stream()
                            .sorted((m1, m2) -> m2.getMeasuredAt().compareTo(m1.getMeasuredAt()))
                            .findFirst()
                            .get();
                    break;
                }
            } catch (ExecutionException | InterruptedException e) {
                log.error("Error while fetching weekly measurements from Firebase for URL: {}", normalizedUrl, e);
            }
        }

        // 2. WeeklyMeasurements에서 찾지 못한 경우, UserMeasurements에서 검색
        if (latestWeeklyMeasurement == null) {
            for (String normalizedUrl : normalizedUrls) {
                Measurements userMeasurement = firebaseUserMeasurementsRepository.findLatestByUrl(normalizedUrl);
                if (userMeasurement != null) {
                    latestWeeklyMeasurement = convertToWeeklyMeasurements(userMeasurement);
                    break;
                }
            }
        }

        return Optional.ofNullable(latestWeeklyMeasurement);
    }

    public WeeklyMeasurements getLatestMeasurementByUrl(String url) {
        return findByUrl(url)
                .orElseThrow(() -> new IllegalArgumentException("No data exists for the given URL: " + url));
    }

    private List<String> normalizeUrl(String url) {
        List<String> normalizedUrls = new ArrayList<>();

        // 마지막에 / 없으면 추가
        if (!url.endsWith("/")) {
            url += "/";
        }

        if (url.startsWith("http://") || url.startsWith("https://")) {
            normalizedUrls.add(url);
        } else {
            normalizedUrls.add("http://" + url);
            normalizedUrls.add("https://" + url);
        }

        return normalizedUrls;
    }

    public WeeklyMeasurements convertToWeeklyMeasurements(Measurements measurements) {
        return WeeklyMeasurements.builder()
                .url(measurements.getUrl())
                .measurementType(measurements.getMeasurementType())
                .measuredAt(measurements.getMeasuredAt())
                .weekStartDate(DateUtil.getWeeksMonday())
                .totalByteWeight(measurements.getTotalByteWeight())
                .canOptimizeCssBytes(measurements.getCanOptimizeCssBytes())
                .canOptimizeJsBytes(measurements.getCanOptimizeJsBytes())
                .modernImageFormatsBytes(measurements.getModernImageFormatsBytes())
                .efficientAnimatedContent(measurements.getEfficientAnimatedContent())
                .thirdPartySummaryWastedBytes(measurements.getThirdPartySummaryWastedBytes())
                .duplicatedJavascript(measurements.getDuplicatedJavascript())
                .totalUnusedBytesScript(measurements.getTotalUnusedBytesScript())
                .totalResourceBytesScript(measurements.getTotalResourceBytesScript())
                .kbWeight(measurements.getKbWeight())
                .carbonEmission(measurements.getCarbonEmission())
                .resourceSummaries(measurements.getResourceSummaries())
                .networkRequests(measurements.getNetworkRequests())
                .build();
    }
}