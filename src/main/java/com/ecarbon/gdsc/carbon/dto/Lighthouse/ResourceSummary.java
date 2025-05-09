package com.ecarbon.gdsc.carbon.dto.Lighthouse;

import lombok.*;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class ResourceSummary {

    private String resourceType;
    private long transferSize;

}