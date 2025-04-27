package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.repository.WeeklyMeasurementsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HomeService {
    private final WeeklyMeasurementsRepository measurementsRepository;

    public WeeklyMeasurements getLatestMeasurementByUrl(String url){
        return measurementsRepository.findTopByUrlOrderByMeasuredAtDesc(url)
                .orElseThrow(() -> new IllegalArgumentException("No data exists for the given URL: " + url));
    }
}
