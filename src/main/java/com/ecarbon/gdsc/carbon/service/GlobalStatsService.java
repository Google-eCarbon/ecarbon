package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.admin.dto.CountryCarbonAvgResponse;
import com.ecarbon.gdsc.carbon.dto.EmissionMapMarker;
import com.ecarbon.gdsc.carbon.dto.GlobalStatsResponse;
import com.ecarbon.gdsc.carbon.dto.TopEmissionPlace;
import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.enums.PlaceCategory;
import com.ecarbon.gdsc.carbon.repository.FirebaseWeeklyMeasurementRepository;
import com.ecarbon.gdsc.carbon.repository.WeeklyMeasurementsRepository;
import com.ecarbon.gdsc.carbon.util.CarbonGradeUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GlobalStatsService {
    private final WeeklyMeasurementsRepository weeklyMeasurementsRepository;
    private final FirebaseWeeklyMeasurementRepository firebaseWeeklyMeasurementRepository;

    private static final int TOP_LIMIT = 5;

    public Optional<GlobalStatsResponse> getGlobalStats(String weekStartDate, PlaceCategory placeCategory) throws ExecutionException, InterruptedException {

        List<WeeklyMeasurements> uniqueMeasurements  = firebaseWeeklyMeasurementRepository.findLatestUniqueByWeekStartDateAndCategory(weekStartDate, placeCategory.getValue());

        List<TopEmissionPlace> topEmissionPlaces = getTopEmissionPlaces(weekStartDate, placeCategory, TOP_LIMIT);

        double average = topEmissionPlaces.stream()
                .mapToDouble(TopEmissionPlace::getCarbonEmission)
                .average()
                .orElse(0.0);

        average = Math.round(average * 100.0) / 100.0;

        List<CountryCarbonAvgResponse.CountryCarbonAvg> countryCarbonAvgs = getCountryCarbonAverages(uniqueMeasurements);
        List<EmissionMapMarker> emissionMapMarkers = getEmissionMapMarkers(uniqueMeasurements);

        GlobalStatsResponse response = GlobalStatsResponse.builder()
                .weekStartDate(weekStartDate)
                .placeCategory(placeCategory.getValue())
                .averageEmissionOfTopPlaces(average)
                .topEmissionPlaces(topEmissionPlaces)
                .countryCarbonAvgs(countryCarbonAvgs)
                .emissionMapMarkers(emissionMapMarkers)
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

            String country = measurement.getPlaceInfo() != null
                    ? measurement.getPlaceInfo().getCountry()
                    : "Unknown;";

            double emission = measurement.getCarbonEmission();

            double kbWeight = measurement.getKbWeight();
            String grade = CarbonGradeUtil.calculateGrade(kbWeight);

            topEmissionPlaces.add(TopEmissionPlace.builder()
                    .rank(rank++)
                    .placeName(placeName)
                    .country(country)
                    .carbonEmission(emission)
                    .grade(grade)
                    .build());
        }

        return topEmissionPlaces;
    }

    private List<CountryCarbonAvgResponse.CountryCarbonAvg> getCountryCarbonAverages(List<WeeklyMeasurements> uniqueMeasurements) {

        // 1. 국가별 평균 탄소배출량 계산
        Map<String, Double> countryCarbonAvgMap = uniqueMeasurements.stream()
                .filter(data -> data.getPlaceInfo() != null && data.getPlaceInfo().getCountry() != null)
                .collect(Collectors.groupingBy(
                        data -> data.getPlaceInfo().getCountry(),
                        Collectors.collectingAndThen(
                                Collectors.averagingDouble(WeeklyMeasurements::getCarbonEmission),
                                avg -> Math.round(avg * 1000.0) / 1000.0 // 소수점 3자리 반올림
                        )
                ));

        // 2. List<CountryCarbonAvg>로 변환
        List<CountryCarbonAvgResponse.CountryCarbonAvg> countryCarbonAverages = countryCarbonAvgMap.entrySet().stream()
                .map(entry -> CountryCarbonAvgResponse.CountryCarbonAvg.builder()
                        .country(entry.getKey())
                        .averageCarbon(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        return countryCarbonAverages;
    }


    private List<EmissionMapMarker> getEmissionMapMarkers(List<WeeklyMeasurements> uniqueMeasurements){
        
        if (uniqueMeasurements == null || uniqueMeasurements.isEmpty()) {
            return Collections.emptyList();
        }

        return uniqueMeasurements.stream()
                .filter(measurement -> measurement.getPlaceInfo() != null) // placeInfo 없는 데이터 필터링
                .map(measurement -> EmissionMapMarker.builder()
                        .url(measurement.getUrl())
                        .placeName(measurement.getPlaceInfo().getName())
                        .carbonEmission(measurement.getCarbonEmission())
                        .latitude(measurement.getPlaceInfo().getLatitude())
                        .longitude(measurement.getPlaceInfo().getLongitude())
                        .build())
                .collect(Collectors.toList());
    }

}
