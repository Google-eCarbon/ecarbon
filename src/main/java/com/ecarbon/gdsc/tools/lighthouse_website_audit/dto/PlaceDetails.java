package com.ecarbon.gdsc.tools.lighthouse_website_audit.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.bson.Document;

@Data
public class PlaceDetails {

    @JsonProperty("formatted_address")
    private String formattedAddress;

    private Geometry geometry;
    private String name;

    @JsonProperty("place_id")
    private String placeId;

    private String website;

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

    public Document toDocument() {
        Document locationDoc = new Document("lat", geometry.getLocation().getLat())
                .append("lng", geometry.getLocation().getLng());

        Document viewportDoc = new Document()
                .append("northeast", new Document("lat", geometry.getViewport().getNortheast().getLat())
                        .append("lng", geometry.getViewport().getNortheast().getLng()))
                .append("southwest", new Document("lat", geometry.getViewport().getSouthwest().getLat())
                        .append("lng", geometry.getViewport().getSouthwest().getLng()));

        Document geometryDoc = new Document("location", locationDoc)
                .append("viewport", viewportDoc);

        return new Document()
                .append("formatted_address", formattedAddress)
                .append("geometry", geometryDoc)
                .append("name", name)
                .append("place_id", placeId)
                .append("website", website);
    }
}

