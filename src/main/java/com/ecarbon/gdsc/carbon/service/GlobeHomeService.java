package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.dto.EmissionMapMarker;
import com.ecarbon.gdsc.carbon.dto.GlobeHomeResponse;
import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.enums.PlaceCategory;
import com.ecarbon.gdsc.carbon.repository.FirebaseWeeklyMeasurementRepository;
import com.ecarbon.gdsc.carbon.repository.WeeklyMeasurementsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GlobeHomeService {
    private final FirebaseWeeklyMeasurementRepository firebaseWeeklyMeasurementRepository ;

    public Optional<GlobeHomeResponse> getGlobeHome(String weekStartDate, PlaceCategory placeCategory) throws ExecutionException, InterruptedException {
        List<WeeklyMeasurements> uniqueMeasurements  = firebaseWeeklyMeasurementRepository.findLatestUniqueByWeekStartDateAndCategory(weekStartDate, placeCategory.getValue());

        List<EmissionMapMarker> markers = getEmissionMapMarkers(uniqueMeasurements);

        GlobeHomeResponse response = GlobeHomeResponse.builder()
                .emissionMapMarkers(markers)
                .build();

        return Optional.of(response);
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
