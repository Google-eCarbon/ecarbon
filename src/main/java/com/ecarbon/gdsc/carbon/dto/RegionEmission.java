package com.ecarbon.gdsc.carbon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RegionEmission {
    private String region;        // 지역명 (예: 대한민국, 미국 등)
    private double avgEmission;  // 평균 배출량 (g)
}
