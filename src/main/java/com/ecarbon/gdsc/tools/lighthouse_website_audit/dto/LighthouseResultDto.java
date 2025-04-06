package com.ecarbon.gdsc.tools.lighthouse_website_audit.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
@AllArgsConstructor
public class LighthouseResultDto {
    private String url;
    private List<NetworkRequestDto> networkRequests;
    private List<ResourceSummaryDto> resourceSummary;
    private UnusedDataDto unusedData;

}
