package com.ecarbon.gdsc.admin.controller;

import com.ecarbon.gdsc.admin.dto.CityCarbonAvgResponse;
import com.ecarbon.gdsc.admin.dto.CountryCarbonAvgResponse;
import com.ecarbon.gdsc.admin.service.AdminDashboardService;
import com.ecarbon.gdsc.carbon.enums.PlaceCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping("/carbon-avg/country")
    public ResponseEntity<CountryCarbonAvgResponse> getCountryCarbonAverages(
            @RequestParam String weekStartDate,
            @RequestParam(defaultValue = "UNIVERSITY") PlaceCategory placeCategory
    ) {

        return dashboardService.getCountryCarbonAverages(weekStartDate, placeCategory)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/carbon-avg/city")
    public ResponseEntity<CityCarbonAvgResponse> getCityCarbonAverages(
            @RequestParam String weekStartDate,
            @RequestParam(defaultValue = "UNIVERSITY") PlaceCategory placeCategory
    ) {

        return dashboardService.getCityCarbonAverages(weekStartDate, placeCategory)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
