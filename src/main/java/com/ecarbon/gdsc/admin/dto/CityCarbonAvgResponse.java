package com.ecarbon.gdsc.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CityCarbonAvgResponse {
    private List<CityCarbonAvg> cityCarbonAverages;

    @Getter
    @Builder
    public static class CityCarbonAvg {
        private String city;
        private double averageCarbon;
    }
}


