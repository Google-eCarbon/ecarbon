package com.ecarbon.gdsc.carbon.controller;

import com.ecarbon.gdsc.carbon.dto.CarbonAnalysisResponse;
import com.ecarbon.gdsc.carbon.service.CarbonAnalysisService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/carbon-analysis")
public class CarbonAnalysisController {

    private final CarbonAnalysisService service;

    @GetMapping
    public ResponseEntity<CarbonAnalysisResponse> getCarbonData(@RequestParam String url, HttpSession session) {

        session.setAttribute("targetUrl", url);

        try {
            return service.analyzeCarbonByUrl(url)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }
}
