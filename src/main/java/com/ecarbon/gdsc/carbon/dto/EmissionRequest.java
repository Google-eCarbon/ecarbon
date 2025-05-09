package com.ecarbon.gdsc.carbon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class EmissionRequest {
    private double dataGb;
    private double newVisitorRatio;
    private double returnVisitorRatio;
    private double dataCacheRatio;
    private double greenHostFactor;
}
