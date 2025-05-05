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

        WeeklyMeasurements measurement = (WeeklyMeasurements) session.getAttribute("userMeasurement");

        if (measurement == null) {
            return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", "/").build();
        }

        try {
            return service.analyzeCarbonByUrl(measurement)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
