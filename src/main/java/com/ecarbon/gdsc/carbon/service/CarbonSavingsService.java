package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.dto.CarbonSavingsResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class CarbonSavingsService {

    // TODO: Build response
    public Optional<CarbonSavingsResponse> getCarbonSavings(String url){

        List<CarbonSavingsResponse.WeeklySavingsData> weeklyGraph = getWeeklySavingsGraph(url);
        List<CarbonSavingsResponse.ImageOptimizationResult> imageResults = getImageOptimizations();
        List<CarbonSavingsResponse.ResourceSavings> resourceSavings = getResourceSavings(url);

        CarbonSavingsResponse response = CarbonSavingsResponse.builder()
                .url(url)
                .totalSavingsInGrams(getTotalSavingsInGrams())
                .weeklySavingsGraph(weeklyGraph)
                .imageOptimizations(imageResults)
                .resourceSavingsData(resourceSavings)
                .build();

        return Optional.of(response);
    }

    // TODO: Implement total savings in grams
    private double getTotalSavingsInGrams() {
        return 12.4;
    }


    // TODO: Implement breakdown of carbon savings by element type
    private List<CarbonSavingsResponse.ResourceSavings> getResourceSavings(String url) {
        // 리소스 종류 리스트
        List<String> resources = List.of(
                "image", "script", "font", "other", "stylesheet", "document", "media", "third-party");

        Random random = new Random();
        List<CarbonSavingsResponse.ResourceSavings> resourceSavingsList = new ArrayList<>();
        long totalSavings = 0;  // 전체 절감량 초기화

        // 리소스별 절감량 계산
        for (String resource : resources) {
            // 랜덤으로 원본 파일 크기 생성 (500KB ~ 2MB)
            long originalSize = 500000 + random.nextInt(1500000);  // 500KB ~ 2MB 사이

            // 랜덤으로 최적화된 파일 크기 생성 (50% ~ 100% 사이로 최적화)
            long optimizedSize = (long) (originalSize * (0.5 + random.nextDouble() * 0.5));

            // 절감량 계산 (Byte 단위)
            long savingsInBytes = originalSize - optimizedSize;

            // 전체 절감량에 누적
            totalSavings += savingsInBytes;

            // 리소스 절감 정보를 리스트에 추가
            resourceSavingsList.add(
                    CarbonSavingsResponse.ResourceSavings.builder()
                            .resourceType(resource)
                            .savingsSize(savingsInBytes)
                            .originalSize(originalSize)
                            .optimizedSize(optimizedSize)
                            .build()
            );
        }

        // 각 리소스의 절감 비율을 계산하여 갱신
        for (CarbonSavingsResponse.ResourceSavings resource : resourceSavingsList) {
            double savingsPercentage = (double) resource.getSavingsSize() / totalSavings * 100;
            savingsPercentage = Math.round(savingsPercentage * 10.0) / 10.0;
            resource.setSavingsPercentage(savingsPercentage);
        }

        return resourceSavingsList;
    }



    // TODO: Implement weekly savings graph data
    private List<CarbonSavingsResponse.WeeklySavingsData> getWeeklySavingsGraph(String url){

        List<CarbonSavingsResponse.WeeklySavingsData> graph = new ArrayList<>();

        String[] weekStarts = {
            "2024-04-21", "2024-04-14", "2024-04-07", "2024-03-31",
            "2024-03-24", "2024-03-17", "2024-03-10", "2024-03-03"
        };

        Random random = new Random();
        for (String week : weekStarts) {
            double savings = 0.5 + (random.nextDouble() * (3.00 - 0.5));

            // 소수점 둘째 자리로 반올림
            BigDecimal savingsRounded = new BigDecimal(savings).setScale(2, RoundingMode.HALF_UP);

            graph.add(CarbonSavingsResponse.WeeklySavingsData.builder()
                    .weekStartDate(week)
                    .savingsInGrams(savingsRounded.doubleValue())
                    .build());
        }

        return graph;
    }

    // TODO: Implement image optimization result retrieval
    private List<CarbonSavingsResponse.ImageOptimizationResult> getImageOptimizations(){
        return List.of(
                CarbonSavingsResponse.ImageOptimizationResult.builder()
                        .originalFileName("ex_banner.png")
                        .success(true)
                        .originalSizeBytes(320_000)
                        .optimizedSizeBytes(180_000)
                        .optimizedFileName("ex_banner.webp")
                        .build(),
                CarbonSavingsResponse.ImageOptimizationResult.builder()
                        .originalFileName("ex_logo.jpg")
                        .success(true)
                        .originalSizeBytes(150_000)
                        .optimizedSizeBytes(0)
                        .optimizedFileName("ex_logo.webp")
                        .build()
        );
    }

    // TODO: Implement user contribution analysis

}
