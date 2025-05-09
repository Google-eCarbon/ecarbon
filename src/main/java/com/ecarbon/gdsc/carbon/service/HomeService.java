package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.repository.FirebaseWeeklyMeasurementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class HomeService {

    private final FirebaseWeeklyMeasurementRepository firebaseWeeklyMeasurementRepository;

    public WeeklyMeasurements getLatestMeasurementByUrl(String url) {
        List<String> normalizedUrls = normalizeUrl(url);

        for (String normalizedUrl : normalizedUrls) {
            try {
                // 인덱스가 필요 없는 메서드 사용
                List<WeeklyMeasurements> measurements = firebaseWeeklyMeasurementRepository.findAllByUrl(normalizedUrl);
                if (!measurements.isEmpty()) {
                    // Java 코드에서 measuredAt 기준으로 정렬하여 가장 최근 데이터 반환
                    return measurements.stream()
                            .sorted((m1, m2) -> m2.getMeasuredAt().compareTo(m1.getMeasuredAt()))
                            .findFirst()
                            .get();
                }
            } catch (ExecutionException | InterruptedException e) {
                log.error("Error while fetching data from Firebase for URL: {}", normalizedUrl, e);
            }
        }

        throw new IllegalArgumentException("No data exists for the given URL: " + url);
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
}