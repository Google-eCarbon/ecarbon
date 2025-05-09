package com.ecarbon.gdsc.admin.service;

import com.ecarbon.gdsc.admin.dto.CityCarbonAvgResponse;
import com.ecarbon.gdsc.admin.dto.CountryCarbonAvgResponse;
import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.enums.PlaceCategory;
import com.ecarbon.gdsc.carbon.repository.WeeklyMeasurementsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final WeeklyMeasurementsRepository weeklyMeasurementsRepository;

    public Optional<CityCarbonAvgResponse> getCityCarbonAverages(String weekStartDate, PlaceCategory placeCategory) {

        // 1. 필터링된 데이터 가져오기
        List<WeeklyMeasurements> rawData = weeklyMeasurementsRepository
                .findByWeekStartDateAndCategory(weekStartDate, placeCategory.getValue());

        // 2. URL 중복 제거
        Map<String, WeeklyMeasurements> uniqueByUrl = rawData.stream()
                .collect(Collectors.toMap(
                        WeeklyMeasurements::getUrl,
                        Function.identity(),
                        (existing, replacement) ->
                                existing.getMeasuredAtAsDateTime().isAfter(replacement.getMeasuredAtAsDateTime()) ? existing : replacement
                ));

        // 3. 도시별 평균 탄소배출량 계산
        Map<String, Double> cityCarbonAvgMap = uniqueByUrl.values().stream()
                .filter(data -> data.getPlaceInfo() != null && data.getPlaceInfo().getCity() != null)
                .collect(Collectors.groupingBy(
                        data -> data.getPlaceInfo().getCity(),
                        Collectors.averagingDouble(WeeklyMeasurements::getCarbonEmission)
                ));

        // 4. List<CityCarbonAvg>로 변환
        List<CityCarbonAvgResponse.CityCarbonAvg> cityCarbonAverages = cityCarbonAvgMap.entrySet().stream()
                .map(entry -> CityCarbonAvgResponse.CityCarbonAvg.builder()
                        .city(entry.getKey())
                        .averageCarbon(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        // 5. CityCarbonAvgResponse로 래핑하고 Optional로 반환
        return Optional.of(CityCarbonAvgResponse.builder()
                .cityCarbonAverages(cityCarbonAverages)
                .build());
    }

    public Optional<CountryCarbonAvgResponse> getCountryCarbonAverages(String weekStartDate, PlaceCategory placeCategory) {

        // 1. 필터링된 데이터 가져오기
        List<WeeklyMeasurements> rawData = weeklyMeasurementsRepository
                .findByWeekStartDateAndCategory(weekStartDate, placeCategory.getValue());

        // 2. URL 중복 제거
        Map<String, WeeklyMeasurements> uniqueByUrl = rawData.stream()
                .collect(Collectors.toMap(
                        WeeklyMeasurements::getUrl,
                        Function.identity(),
                        (existing, replacement) ->
                                existing.getMeasuredAtAsDateTime().isAfter(replacement.getMeasuredAtAsDateTime()) ? existing : replacement
                ));

        // 3. 국가별 평균 탄소배출량 계산
        Map<String, Double> countryCarbonAvgMap = uniqueByUrl.values().stream()
                .filter(data -> data.getPlaceInfo() != null && data.getPlaceInfo().getCountry() != null)
                .collect(Collectors.groupingBy(
                        data -> data.getPlaceInfo().getCountry(),
                        Collectors.averagingDouble(WeeklyMeasurements::getCarbonEmission)
                ));

        // 4. List<CountryCarbonAvg>로 변환
        List<CountryCarbonAvgResponse.CountryCarbonAvg> countryCarbonAverages = countryCarbonAvgMap.entrySet().stream()
                .map(entry -> CountryCarbonAvgResponse.CountryCarbonAvg.builder()
                        .country(entry.getKey())
                        .averageCarbon(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        // 5. CountryCarbonAvgResponse로 래핑하고 Optional로 반환
        return Optional.of(CountryCarbonAvgResponse.builder()
                .countryCarbonAvgs(countryCarbonAverages)
                .build());
    }
}

