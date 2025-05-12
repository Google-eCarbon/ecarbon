package com.ecarbon.gdsc.carbon.dto;

import lombok.*;

@Builder
@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class EmissionMapMarker {
    private String placeName;

    private double carbonEmission;

    private double latitude;
    private double longitude;

    private String url;
}
