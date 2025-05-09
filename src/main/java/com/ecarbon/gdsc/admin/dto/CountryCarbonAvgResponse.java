package com.ecarbon.gdsc.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CountryCarbonAvgResponse {
    private List<CountryCarbonAvg> countryCarbonAvgs;

    @Getter
    @Builder
    public static class CountryCarbonAvg {
        private String country;
        private double averageCarbon;
    }
}
