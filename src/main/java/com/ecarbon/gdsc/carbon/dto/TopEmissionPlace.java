package com.ecarbon.gdsc.carbon.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TopEmissionPlace {
    private int rank;
    private String url;
    private String placeName;
    private String country;
    private double carbonEmission;
    private String grade;
}
