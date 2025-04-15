package com.ecarbon.gdsc.carbon.dto.Lighthouse;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@ToString
public class NetworkRequest {

    private String url;
    private String resourceType;
    private long resourceSize;
    private long transferSize;

}