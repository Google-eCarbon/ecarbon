package com.ecarbon.gdsc.carbon.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ResourcePercentage {
    private String resourceType;
    private long size;
    private double percentage;
}
