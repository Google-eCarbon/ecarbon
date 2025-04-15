package com.ecarbon.gdsc.carbon.controller;

import com.ecarbon.gdsc.carbon.service.CarbonAnalysisService;
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
    private final MongoTemplate mongoTemplate;

    @GetMapping
    public ResponseEntity<?> getCarbonData(@RequestParam String url) {
        log.info("Received request for URL: {}", url);
        try {
            return service.analyzeCarbonByUrl(url)
                    .map(data -> {
                        log.info("Data found for URL: {}", url);
                        return ResponseEntity.ok(data);
                    })
                    .orElseGet(() -> {
                        log.warn("No data found for URL: {}", url);
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            log.error("Error processing request for URL: {}", url, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing request: " + e.getMessage());
        }
    }
}
