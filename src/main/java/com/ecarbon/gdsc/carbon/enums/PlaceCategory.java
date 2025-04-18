package com.ecarbon.gdsc.carbon.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum PlaceCategory {

    UNIVERSITY("University"),
    PUBLIC_INSTITUTION("PublicInstitution");

    private final String value;
}
