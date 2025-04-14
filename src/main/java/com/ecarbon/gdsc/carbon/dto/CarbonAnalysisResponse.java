package com.ecarbon.gdsc.carbon.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Builder
@Getter
public class CarbonAnalysisResponse {
    // url
    private String url;

    /*optimization Data 들*/
    // third_party_summary_wasted_bytes
    // total_unused_bytes_script
    // total_resource_bytes_script
    // total_byte_weight
    // can_optimize_css_bytes
    // can_optimize_js_bytes
    // modern_image_formats_bytes
    // efficient_animated_content
    // duplicated_javascript
    // resourceSummaries[]
    private long total_byte_weight;
    private List<ResourcePercentage> resourcePercentage;
    private CarbonEquivalents carbonEquivalents;


    // grade    (등급) -> calculateGrade(kb)
    // carbon_emission      (탄소 배출량)
    // kb_weight        (페이지 크기) -> total_byte_weight/1024
    private double carbonEmission;
    private double kbWeight;
    private String grade;

    // global_avg_carbon    (세계 평균)     -> round(estimate_emission_per_page(0.002344), 2)
    // korea_avg_carbon     (한국 평균)     -> round(estimate_emission_per_page(0.00456), 2)


    // korea_diff       (한국 평균과의 차이)            -> round(korea_diff, 2)
    // global_diff      (세계 평균과의 차이)            -> round(global_diff, 2)
    // korea_diff_abs   (한국 평균과의 차이(절대값))    -> round(global_diff, 2)
    // global_diff_abs  (세계 평균과의 차이(절대값))    -> round(korea_diff_abs, 2)

    // institution_type (기관 유형)
    // analysis_date    (분석 일시)
    // subpages_data    (하위 페이지 데이터)
}
