package com.ecarbon.gdsc.carbon.dto;

import lombok.*;

import java.util.List;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CarbonSavingsResponse {
    // 절감 사이트 (세션)
    private String url;

    // 총 절감량 (g)
    private double totalSavingsInGrams;

    // 절감량 그래프 (월간 - x좌표는 한주단위)
    private List<WeeklySavingsData> weeklySavingsGraph;

    // 이미지 최적화 결과
    private List<ImageOptimizationResult> imageOptimizations;

    // 절감 요인 비율
    private List<ResourceSavings> resourceSavingsData;


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

    @Builder
    @Getter
    @Setter
    public static class ResourceSavings {

        private String resourceType;

        private long originalSize;
        private long optimizedSize;

        private long savingsSize;
        private double savingsPercentage;
    }
}
