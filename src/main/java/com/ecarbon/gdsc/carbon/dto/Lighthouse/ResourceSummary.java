package com.ecarbon.gdsc.carbon.dto.Lighthouse;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@ToString
public class ResourceSummary {

    private String resourceType;
    private long transferSize;

}