package com.ecarbon.gdsc.carbon.controller;

import com.ecarbon.gdsc.carbon.dto.CarbonSavingsResponse;
import com.ecarbon.gdsc.carbon.service.CarbonSavingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/carbon-savings")
public class CarbonSavingsController {

    private final CarbonSavingsService carbonSavingsService;

    @GetMapping
    public ResponseEntity<CarbonSavingsResponse> carbonSavings(){

        return carbonSavingsService.getCarbonSavings()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());

    }
}
