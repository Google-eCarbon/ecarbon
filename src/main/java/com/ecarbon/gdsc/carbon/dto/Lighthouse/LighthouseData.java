package com.ecarbon.gdsc.carbon.dto.Lighthouse;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LighthouseData {
    private String url;
    private OptimizationData optimizationData;
    private ResourceData resourceData;
    private TrafficData trafficData;
}
