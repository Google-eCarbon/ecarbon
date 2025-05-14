package com.ecarbon.gdsc.carbon.controller;

import com.ecarbon.gdsc.audits.entity.Measurements;
import com.ecarbon.gdsc.auth.entity.User;
import com.ecarbon.gdsc.auth.principal.CustomOAuth2User;
import com.ecarbon.gdsc.auth.repository.FirebaseUserRepository;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import com.ecarbon.gdsc.audits.lighthouse.LighthouseAuditService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/")
@Slf4j
public class HomeController {

    private final HomeService homePageService;
    private final GlobeHomeService globeHomeService;
    private final FirebaseUserRepository firebaseUserRepository;
    private final LighthouseAuditService lighthouseAuditService;

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

    @PostMapping("/api/start-measurement")
    public ResponseEntity<String> startMeasurement(@RequestParam String url, HttpSession session) {
        try {
//            // 세션에서 사용자 정보 확인
//            CustomOAuth2User oAuth2User = (CustomOAuth2User) session.getAttribute("user");
//            if (oAuth2User == null) {
//                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
//            }

            // Lighthouse 측정 시작
            Measurements data = lighthouseAuditService.startAudit(url);
            WeeklyMeasurements weeklyData = homePageService.convertToWeeklyMeasurements(data);
            session.setAttribute("userMeasurement", weeklyData);
            session.setAttribute("userUrl", url);
            log.info(weeklyData.toString());
            return ResponseEntity.ok("성능 측정이 완료");

        } catch (Exception e) {
            log.error("성능 측정 시작 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("성능 측정 시작 중 오류가 발생했습니다.");
        }
    }

    @PostMapping("/api/start-analysis")
    public ResponseEntity<String> startAnalysis(
            @RequestParam String url,
            HttpSession session,
            @AuthenticationPrincipal CustomOAuth2User customOAuth2User) {
        try {
            // URL 유효성 검사
            if (url == null || url.isBlank()) {
                return ResponseEntity.badRequest().body("웹사이트 URL이 필요합니다");
            }

            try {
                // DB에서 측정 데이터 조회
                WeeklyMeasurements data = homePageService.getLatestMeasurementByUrl(url);
                session.setAttribute("userMeasurement", data);
                session.setAttribute("userUrl", data.getUrl());
                return ResponseEntity.ok("측정 데이터가 존재합니다");

            } catch (IllegalArgumentException e) {
                // 데이터가 없는 경우 IllegalArgumentException 처리
                log.info("측정 데이터 없음 - URL: {}", url);
                return ResponseEntity.ok("아직 측정된 데이터가 없습니다");
            }

        } catch (Exception e) {
            log.error("분석 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("분석 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @PostMapping("/api/save-measurement-to-user")
    public ResponseEntity<String> saveMeasurementToUser(
            @AuthenticationPrincipal CustomOAuth2User customOAuth2User,
            HttpSession session) {
        
        if (customOAuth2User == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인이 필요한 기능입니다.");
        }
        
        WeeklyMeasurements measurement = (WeeklyMeasurements) session.getAttribute("userMeasurement");
        
        if (measurement == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("저장할 측정 결과가 없습니다. 먼저 분석을 진행해주세요.");
        }
        
        try {
            String email = customOAuth2User.getEmail();
            log.info("세션의 측정 결과를 사용자 측정 로그에 저장 - 이메일: {}", email);
            
            // 사용자 정보 조회
            User user = firebaseUserRepository.findByEmail(email);
            
            if (user != null) {
                // 사용자 측정 로그 목록이 없으면 새로 생성
                if (user.getUser_measurement_logs() == null) {
                    user.setUser_measurement_logs(new ArrayList<>());
                }
                
                // 측정 결과를 사용자 측정 로그에 추가
                user.getUser_measurement_logs().add(measurement);
                
                // 사용자 정보 업데이트
                firebaseUserRepository.update(user);
                
                log.info("사용자 측정 로그 저장 완료 - 이메일: {}, URL: {}", email, measurement.getUrl());
                return ResponseEntity.ok("측정 결과가 사용자 측정 로그에 저장되었습니다.");
            } else {
                log.warn("사용자 정보를 찾을 수 없음 - 이메일: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("사용자 정보를 찾을 수 없습니다.");
            }
        } catch (Exception e) {
            log.error("사용자 측정 로그 저장 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("측정 결과 저장 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
