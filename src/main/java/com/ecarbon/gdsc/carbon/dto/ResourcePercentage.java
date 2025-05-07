package com.ecarbon.gdsc.carbon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourcePercentage {
    private String resourceType;
    private long size;
    private double percentage;
}
