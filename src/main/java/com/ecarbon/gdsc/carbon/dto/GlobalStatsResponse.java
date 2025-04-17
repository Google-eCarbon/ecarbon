package com.ecarbon.gdsc.carbon.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class GlobalStatsResponse {

//    private String target;

    private List<TopEmissionPlace> topEmissionPlaces;
    private double averageEmissionOfTopPlaces;
//    private List<RegionEmission> regionalAverages;

}
