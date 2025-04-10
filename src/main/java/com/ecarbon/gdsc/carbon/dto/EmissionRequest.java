package com.ecarbon.gdsc.carbon.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class EmissionRequest {
    private double dataGb;
    private double newVisitorRatio;
    private double returnVisitorRatio;
    private double dataCacheRatio;
    private double greenHostFactor;
}
