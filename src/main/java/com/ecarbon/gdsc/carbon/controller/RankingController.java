package com.ecarbon.gdsc.carbon.controller;

import com.ecarbon.gdsc.carbon.dto.RankingResponse;
import com.ecarbon.gdsc.carbon.dto.TopEmissionPlace;
import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.enums.PlaceCategory;
import com.ecarbon.gdsc.carbon.util.DateUtil;
import com.ecarbon.gdsc.carbon.util.RankingUtil;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ranking")
public class RankingController {

    private final RankingUtil rankingUtil;

    @GetMapping
    public ResponseEntity<RankingResponse> getRanking(
            HttpSession session,
            @RequestParam(required = false) String weekStartDate,
            @RequestParam(defaultValue = "UNIVERSITY") PlaceCategory placeCategory) {

        if (weekStartDate == null || weekStartDate.isBlank()) {
            weekStartDate = DateUtil.getWeeksMonday();
        }

        List<TopEmissionPlace> topEmissionPlaces = rankingUtil.getTopEmissionPlaces(weekStartDate, placeCategory, 10);

        if (topEmissionPlaces.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        RankingResponse response = RankingResponse.builder()
                .updatedAt(weekStartDate)
                .topEmissionPlaces(topEmissionPlaces)
                .build();

        return ResponseEntity.ok(response);
    }
}

