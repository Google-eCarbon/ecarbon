package com.ecarbon.gdsc.carbon.controller;

import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.ecarbon.gdsc.carbon.service.HomeService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class HomeController {

    private final HomeService homePageService;

    @PostMapping("/api/start-analysis")
    public String startAnalysis(@RequestParam String url, HttpSession session){
        WeeklyMeasurements data = homePageService.getLatestMeasurementByUrl(url);

        session.setAttribute("userMeasurement", data);
        session.setAttribute("userUrl", data.getUrl());

        return "redirect:/api/carbon-analysis";
    }
}
