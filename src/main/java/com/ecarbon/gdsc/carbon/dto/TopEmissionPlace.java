package com.ecarbon.gdsc.carbon.dto;


import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class TopEmissionPlace {
    private int rank;
    private String placeName;
    private double carbonEmission;
    private String grade;
}
