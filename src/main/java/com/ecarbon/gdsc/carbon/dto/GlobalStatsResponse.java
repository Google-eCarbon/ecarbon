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

}
