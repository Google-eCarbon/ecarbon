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

        CarbonSavingsResponse response = CarbonSavingsResponse.builder()
                .weeklySavingsGraph(weeklyGraph)
                .build();

        return Optional.of(response);
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

    // TODO: Implement user contribution analysis

}
