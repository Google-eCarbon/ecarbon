package com.ecarbon.gdsc.carbon.controller;

import com.ecarbon.gdsc.carbon.dto.GlobalStatsResponse;
import com.ecarbon.gdsc.carbon.enums.PlaceCategory;
import com.ecarbon.gdsc.carbon.service.GlobalStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;


@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/global-stats")
public class GlobalStatsController {

    private final GlobalStatsService globalStatsService;

    @GetMapping
    public ResponseEntity<GlobalStatsResponse> getGlobalStats(
            @RequestParam(required = false) String weekStartDate,
            @RequestParam(defaultValue = "UNIVERSITY") PlaceCategory placeCategory) {

        // deafult는 세션에서 받아오는 방식으로 변경 필요
        if (weekStartDate == null || weekStartDate.isBlank()) {
            LocalDate now = LocalDate.now();
            weekStartDate = now.with(java.time.DayOfWeek.MONDAY)
                    .format(DateTimeFormatter.ISO_DATE);
        }

        log.info("전체 통계 조회 요청: weekStartDate={}, placeType={}", weekStartDate, placeCategory);

        return globalStatsService.getGlobalStats(weekStartDate, placeCategory)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
