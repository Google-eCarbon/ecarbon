package com.ecarbon.gdsc.carbon.controller;

import com.ecarbon.gdsc.carbon.dto.CarbonAnalysisResponse;
import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.service.CarbonAnalysisService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/carbon-analysis")
public class CarbonAnalysisController {

    private final CarbonAnalysisService service;

    @GetMapping
    public ResponseEntity<CarbonAnalysisResponse> getCarbonData(HttpSession session, HttpServletResponse response) {
        log.info("세션 ID: {}", session.getId());
        log.info("세션 속성들: {}", session.getAttributeNames().hasMoreElements());
        
        WeeklyMeasurements measurement = (WeeklyMeasurements) session.getAttribute("userMeasurement");
        log.info("userMeasurement 존재 여부: {}", (measurement != null));
        
        if (measurement == null) {
            log.warn("세션에 userMeasurement가 없습니다. 홈으로 리디렉션합니다.");
            return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", "/").build();
        }

        try {
            log.info("측정된 URL: {}", measurement.getUrl());
            return service.analyzeCarbonByUrl(measurement)
                    .map(result -> {
                        log.info("분석 결과 성공: {}", result);
                        return ResponseEntity.ok(result);
                    })
                    .orElseGet(() -> {
                        log.warn("분석 결과를 찾을 수 없습니다.");
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            log.error("탄소 분석 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
