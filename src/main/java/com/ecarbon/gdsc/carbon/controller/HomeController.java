package com.ecarbon.gdsc.carbon.controller;

import com.ecarbon.gdsc.carbon.dto.GlobeHomeResponse;
import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.enums.PlaceCategory;
import com.ecarbon.gdsc.carbon.service.GlobeHomeService;
import com.ecarbon.gdsc.carbon.service.HomeService;
import com.ecarbon.gdsc.carbon.util.DateUtil;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.concurrent.ExecutionException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/")
@Slf4j
public class HomeController {

    private final HomeService homePageService;
    private final GlobeHomeService globeHomeService;

    @GetMapping
    public ResponseEntity<GlobeHomeResponse> getMapMarker(
            @RequestParam(required = false) String weekStartDate,
            @RequestParam(defaultValue = "UNIVERSITY") PlaceCategory placeCategory){

        try {
            if (weekStartDate == null || weekStartDate.isBlank()) {
                weekStartDate = DateUtil.getWeeksMonday();
            }

            Optional<GlobeHomeResponse> responseOpt = globeHomeService.getGlobeHome(weekStartDate, placeCategory);

            return responseOpt
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.noContent().build()); // 결과 없음 처리

        } catch (InterruptedException | ExecutionException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // 서버 에러 처리
        }
    }

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
