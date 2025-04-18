package com.ecarbon.gdsc.carbon.service;

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
import java.util.Optional;

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

        GlobalStatsResponse response = GlobalStatsResponse.builder()
                .weekStartDate(weekStartDate)
                .placeCategory(placeCategory.getValue())
                .averageEmissionOfTopPlaces(average)
                .topEmissionPlaces(topEmissionPlaces)
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
}
