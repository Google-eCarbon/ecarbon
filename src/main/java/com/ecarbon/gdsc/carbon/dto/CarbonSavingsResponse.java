package com.ecarbon.gdsc.carbon.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class CarbonSavingsResponse {
    // 절감 사이트 (세션)

    // 총 절감량 (g)
    private double totalSavingsInGrams;

    // 4주 평균
    
    // 전주 대비 ..% 감소

    // 절감량 그래프 (월간 - x좌표는 한주단위)
    private List<WeeklySavingsData> weeklySavingsGraph;

    // 이미지 최적화 결과
    private List<ImageOptimizationResult> imageOptimizations;
    // 최적화 대상 파일 -> 성공 여부 / 원본 파일 / 원본 파일크기 / 변환 파일 / 변환파일 크기


    @Builder
    @Getter
    public static class WeeklySavingsData {
        private String weekStartDate;
        private double savingsInGrams;
    }

    @Builder
    @Getter
    public static class ImageOptimizationResult {

        private String originalFileName;
        private boolean success;

        private long originalSizeBytes;
        private long optimizedSizeBytes;

        private String optimizedFileName;

    }
}
