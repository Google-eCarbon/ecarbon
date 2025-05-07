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
    private String placeName;
    private double carbonEmission;
    private String grade;
}
