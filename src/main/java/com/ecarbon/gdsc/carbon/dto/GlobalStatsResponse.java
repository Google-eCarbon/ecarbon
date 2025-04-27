package com.ecarbon.gdsc.carbon.dto;

import com.ecarbon.gdsc.admin.dto.CountryCarbonAvgResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class GlobalStatsResponse {

    private String weekStartDate;
    private String placeCategory;

    private List<TopEmissionPlace> topEmissionPlaces;
    private double averageEmissionOfTopPlaces;

    private List<CountryCarbonAvgResponse.CountryCarbonAvg> countryCarbonAvgs;

    private List<EmissionMapMarker> emissionMapMarkers;


    @Builder
    @Getter
    public static class EmissionMapMarker{
        private String placeName;

        private double carbonEmission;

        private double latitude;
        private double longitude;

        private String url;
    }
}
