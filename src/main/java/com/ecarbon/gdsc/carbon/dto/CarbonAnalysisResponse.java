package com.ecarbon.gdsc.carbon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CarbonAnalysisResponse {

    private String measuredAt;

    private String url;

    private long total_byte_weight;
    private List<ResourcePercentage> resourcePercentage;
    private CarbonEquivalents carbonEquivalents;

    private double carbonEmission;
    private double kbWeight;
    private String grade;

    private double globalAvgCarbon;
}
