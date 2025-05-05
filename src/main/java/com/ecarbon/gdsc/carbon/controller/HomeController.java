package com.ecarbon.gdsc.carbon.controller;

import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.service.HomeService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class HomeController {

    private final HomeService homePageService;

    @PostMapping("/api/start-analysis")
    public ResponseEntity<String> startAnalysis(@RequestParam String url, HttpSession session){
        try {
            WeeklyMeasurements data = homePageService.getLatestMeasurementByUrl(url);

            session.setAttribute("userMeasurement", data);
            session.setAttribute("userUrl", data.getUrl());

            return ResponseEntity.ok("분석 세션 저장 완료");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("분석 중 오류 발생: " + e.getMessage());
        }
    }
}
