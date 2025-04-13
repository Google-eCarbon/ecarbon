package com.ecarbon.gdsc.carbon.dto.Lighthouse;

import com.ecarbon.gdsc.carbon.entity.OptimizationData;
import com.ecarbon.gdsc.carbon.entity.ResourceData;
import com.ecarbon.gdsc.carbon.entity.TrafficData;
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
