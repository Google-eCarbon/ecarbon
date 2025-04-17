package com.ecarbon.gdsc.carbon.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Builder
@Getter
public class GlobalStatsResponse {

    private String target;
    private LocalDateTime analysisDate;

    private List<CarbonEmissionRank> top5GreenWebsites;
    private List<RegionEmission> regionalAverages;

}
