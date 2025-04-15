package com.ecarbon.gdsc.tools.univ_details_processor;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UniversityLocationInfo {
    public String title;
    public String universityName;
    public String country;
    public String fullLocation;
    public String placeId; // 새로 추가됨

    public void setPlaceId(String placeId) {
        this.placeId = placeId;
    }
}
