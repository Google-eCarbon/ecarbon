package com.ecarbon.gdsc.carbon.controller;

import com.ecarbon.gdsc.carbon.dto.GlobalStatsResponse;
import com.ecarbon.gdsc.carbon.service.GlobalStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/global-stats")
public class GlobalStatsController {

    private final GlobalStatsService globalStatsService;

    @GetMapping
    public ResponseEntity<GlobalStatsResponse> getGlobalStats(
            @RequestParam String weekStartDate){
        log.info("전체 통계 조회 요청: weekStartDate={}, limit={}", weekStartDate);

        return globalStatsService.getGlobalStats(weekStartDate)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
