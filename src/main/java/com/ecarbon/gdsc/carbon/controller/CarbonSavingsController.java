package com.ecarbon.gdsc.carbon.controller;

import com.ecarbon.gdsc.carbon.dto.CarbonSavingsResponse;
import com.ecarbon.gdsc.carbon.entity.ReductionLogs;
import com.ecarbon.gdsc.carbon.service.CarbonSavingsService;
import com.ecarbon.gdsc.carbon.service.FirebaseReductionLogsService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.ExecutionException;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/carbon-savings")
public class CarbonSavingsController {

    private final CarbonSavingsService carbonSavingsService;

    private final FirebaseReductionLogsService reductionLogsService;

    @GetMapping("/reduction-logs")
    public ResponseEntity<ReductionLogs> getReductionLogsByDomain(@RequestParam String domain) {
        try {
            log.info("Fetching reduction logs for domain: {}", domain);
            ReductionLogs result = reductionLogsService.findByDomain(domain);
            if (result == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error retrieving reduction logs for domain: {}", domain, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping
    public ResponseEntity<CarbonSavingsResponse> carbonSavings(HttpSession session) throws ExecutionException, InterruptedException {

        String url = (String) session.getAttribute("userUrl");

        return carbonSavingsService.getCarbonSavings(url)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());

    }
}
