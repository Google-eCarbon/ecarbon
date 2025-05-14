package com.ecarbon.gdsc.audits.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Data
public class PlaceDetails {

    @JsonProperty("formatted_address")
    private String formattedAddress;

    private Geometry geometry;
    private String name;

    @JsonProperty("place_id")
    private String placeId;

    private String website;

    @JsonProperty("address_components")
    private List<AddressComponent> addressComponents;

    @Data
    public static class Geometry {
        private Location location;
        private Viewport viewport;
    }

    @Data
    public static class Location {
        private double lat;
        private double lng;
    }

    @Data
    public static class Viewport {
        private Location northeast;
        private Location southwest;
    }

    @Data
    public static class AddressComponent {
        @JsonProperty("long_name")
        private String longName;

        @JsonProperty("short_name")
        private String shortName;

        private List<String> types;
    }
}

