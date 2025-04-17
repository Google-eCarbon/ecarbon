package com.ecarbon.gdsc.carbon.dto;


import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class CarbonEmissionRank {
    private int rank;              // 순위
    private String organization;   // 기관명
    private double avgEmission;   // 평균 배출량 (g)
    private String grade;          // 등급 (예: A, B, C)
    private double globalAverage; // 전체 평균 배출량 (비교용)
}
