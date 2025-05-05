package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.repository.WeeklyMeasurementsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class HomeService {

    private final WeeklyMeasurementsRepository measurementsRepository;

    public WeeklyMeasurements getLatestMeasurementByUrl(String url){

        List<String> normalizedUrls = normalizeUrl(url);

        return normalizedUrls.stream()
                .map(measurementsRepository::findTopByUrlOrderByMeasuredAtDesc)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .findFirst()
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

}
