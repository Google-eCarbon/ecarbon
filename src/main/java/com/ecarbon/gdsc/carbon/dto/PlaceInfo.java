package com.ecarbon.gdsc.carbon.dto;

import lombok.*;

@Builder
@Getter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class PlaceInfo {
    private String name;
    private String category;

    private double latitude;
    private double longitude;

    private String address;
    private String country;
    private String city;
}
