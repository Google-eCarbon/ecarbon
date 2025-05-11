package com.ecarbon.gdsc.carbon.util;

import com.ecarbon.gdsc.carbon.dto.TopEmissionPlace;
import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.enums.PlaceCategory;
import com.ecarbon.gdsc.carbon.repository.WeeklyMeasurementsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class RankingUtil {

    private final WeeklyMeasurementsRepository weeklyMeasurementsRepository;

    public List<TopEmissionPlace> getTopEmissionPlaces(String weekStartDate, PlaceCategory placeCategory, int limit) {

        List<WeeklyMeasurements> measurements = weeklyMeasurementsRepository.findLowestCarbonEmissions(weekStartDate, placeCategory.getValue(), limit);
        List<TopEmissionPlace> topEmissionPlaces = new ArrayList<>();

        int rank = 1;
        for (WeeklyMeasurements measurement : measurements) {
            String url = measurement.getUrl();
            String placeName = measurement.getPlaceInfo() != null ? measurement.getPlaceInfo().getName() : "Unknown";
            String country = measurement.getPlaceInfo() != null ? measurement.getPlaceInfo().getCountry() : "Unknown";
            double emission = measurement.getCarbonEmission();
            double kbWeight = measurement.getKbWeight();
            String grade = CarbonGradeUtil.calculateGrade(kbWeight);

            topEmissionPlaces.add(TopEmissionPlace.builder()
                    .url(url)
                    .rank(rank++)
                    .placeName(placeName)
                    .country(country)
                    .carbonEmission(emission)
                    .grade(grade)
                    .build());
        }

        return topEmissionPlaces;
    }
}
