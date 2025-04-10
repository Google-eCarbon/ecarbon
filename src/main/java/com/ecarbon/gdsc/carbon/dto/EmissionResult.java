package com.ecarbon.gdsc.carbon.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EmissionResult {
    private double datacenter;
    private double network;
    private double userDevice;
}
