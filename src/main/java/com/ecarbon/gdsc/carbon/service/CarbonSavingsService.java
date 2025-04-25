package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.dto.CarbonSavingsResponse;
import org.springframework.stereotype.Service;

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

        CarbonSavingsResponse response = CarbonSavingsResponse.builder()
                .totalSavingsInGrams(getTotalSavingsInGrams())
                .weeklySavingsGraph(weeklyGraph)
                .imageOptimizations(imageResults)
                .build();

        return Optional.of(response);
    }

    // TODO: Implement total savings in grams
    private double getTotalSavingsInGrams() {
        return 12.4;
    }

    // TODO: Implement breakdown of carbon savings by element type

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

            graph.add(CarbonSavingsResponse.WeeklySavingsData.builder()
                    .weekStartDate(week)
                    .savingsInGrams(savings)
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
