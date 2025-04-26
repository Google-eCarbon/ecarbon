package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.admin.dto.CountryCarbonAvgResponse;
import com.ecarbon.gdsc.carbon.dto.GlobalStatsResponse;
import com.ecarbon.gdsc.carbon.dto.TopEmissionPlace;
import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.enums.PlaceCategory;
import com.ecarbon.gdsc.carbon.repository.WeeklyMeasurementsRepository;
import com.ecarbon.gdsc.carbon.util.CarbonGradeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GlobalStatsService {
    private final WeeklyMeasurementsRepository weeklyMeasurementsRepository;

    private static int TopLimit = 5;

    public Optional<GlobalStatsResponse> getGlobalStats(String weekStartDate, PlaceCategory placeCategory){

        List<TopEmissionPlace> topEmissionPlaces = getTopEmissionPlaces(weekStartDate, placeCategory, TopLimit);

        double average = topEmissionPlaces.stream()
                .mapToDouble(TopEmissionPlace::getCarbonEmission)
                .average()
                .orElse(0.0);

        average = Math.round(average * 100.0) / 100.0;

        List<CountryCarbonAvgResponse.CountryCarbonAvg> countryCarbonAvgs = getCountryCarbonAverages(weekStartDate, placeCategory);

        GlobalStatsResponse response = GlobalStatsResponse.builder()
                .weekStartDate(weekStartDate)
                .placeCategory(placeCategory.getValue())
                .averageEmissionOfTopPlaces(average)
                .topEmissionPlaces(topEmissionPlaces)
                .countryCarbonAvgs(countryCarbonAvgs)
                .build();

        return Optional.of(response);
    }

    private List<TopEmissionPlace> getTopEmissionPlaces(String weekStartDate, PlaceCategory placeCategory, int limit){

        log.info(placeCategory.getValue());

        List<WeeklyMeasurements> measurements = weeklyMeasurementsRepository.findLowestCarbonEmissions(weekStartDate, placeCategory.getValue() ,limit);
        List<TopEmissionPlace> topEmissionPlaces = new ArrayList<>();

        int rank = 1;

        for(WeeklyMeasurements measurement : measurements){
            String placeName = measurement.getPlaceInfo() != null
                    ? measurement.getPlaceInfo().getName()
                    : "Unknown;";

            double emission = measurement.getCarbonEmission();

            double kbWeight = measurement.getKbWeight();
            String grade = CarbonGradeUtil.calculateGrade(kbWeight);

            topEmissionPlaces.add(TopEmissionPlace.builder()
                    .rank(rank++)
                    .placeName(placeName)
                    .carbonEmission(emission)
                    .grade(grade)
                    .build());
        }

        return topEmissionPlaces;
    }

    private List<CountryCarbonAvgResponse.CountryCarbonAvg> getCountryCarbonAverages(String weekStartDate, PlaceCategory placeCategory) {

        // 1. 필터링된 데이터 가져오기
        List<WeeklyMeasurements> rawData = weeklyMeasurementsRepository
                .findByWeekStartDateAndCategory(weekStartDate, placeCategory.getValue());

        // 2. URL 중복 제거
        Map<String, WeeklyMeasurements> uniqueByUrl = rawData.stream()
                .collect(Collectors.toMap(
                        WeeklyMeasurements::getUrl,
                        Function.identity(),
                        (existing, replacement) -> existing.getMeasuredAt().isAfter(replacement.getMeasuredAt()) ? existing : replacement
                ));

        // 3. 국가별 평균 탄소배출량 계산
        Map<String, Double> countryCarbonAvgMap = uniqueByUrl.values().stream()
                .filter(data -> data.getPlaceInfo() != null && data.getPlaceInfo().getCountry() != null)
                .collect(Collectors.groupingBy(
                        data -> data.getPlaceInfo().getCountry(),
                        Collectors.collectingAndThen(
                                Collectors.averagingDouble(WeeklyMeasurements::getCarbonEmission),
                                avg -> Math.round(avg * 1000.0) / 1000.0
                        )
                ));

        // 4. List<CountryCarbonAvg>로 변환
        List<CountryCarbonAvgResponse.CountryCarbonAvg> countryCarbonAverages = countryCarbonAvgMap.entrySet().stream()
                .map(entry -> CountryCarbonAvgResponse.CountryCarbonAvg.builder()
                        .country(entry.getKey())
                        .averageCarbon(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        return countryCarbonAverages;
    }
}
