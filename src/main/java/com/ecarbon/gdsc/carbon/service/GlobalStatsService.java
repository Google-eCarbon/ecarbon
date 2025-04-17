package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.dto.GlobalStatsResponse;
import com.ecarbon.gdsc.carbon.dto.TopEmissionPlace;
import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.repository.WeeklyMeasurementsRepository;
import com.ecarbon.gdsc.carbon.util.CarbonGradeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class GlobalStatsService {
    private final WeeklyMeasurementsRepository weeklyMeasurementsRepository;

    private static int TopLimit = 5;

    public Optional<GlobalStatsResponse> getGlobalStats(String weekStartDate){

        List<TopEmissionPlace> topEmissionPlaces = getTopEmissionPlaces(weekStartDate, TopLimit);

        double average = topEmissionPlaces.stream()
                .mapToDouble(TopEmissionPlace::getCarbonEmission)
                .average()
                .orElse(0.0);


        GlobalStatsResponse response = GlobalStatsResponse.builder()
                .averageEmissionOfTopPlaces(average)
                .topEmissionPlaces(topEmissionPlaces)
                .build();

        return Optional.of(response);
    }

    private List<TopEmissionPlace> getTopEmissionPlaces(String weekStartDate, int limit){

        List<WeeklyMeasurements> measurements = weeklyMeasurementsRepository.findLowestCarbonEmissions(weekStartDate, limit);
        List<TopEmissionPlace> topEmissionPlaces = new ArrayList<>();

        int rank = 1;

        for(WeeklyMeasurements measurement : measurements){
            String placeName = measurement.getPlaceInfo() != null
                    ? measurement.getPlaceInfo().getName()
                    : "Unknown;";

            double emission = measurement.getCarbonEmission();
            String grade = CarbonGradeUtil.calculateGrade(emission);

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
