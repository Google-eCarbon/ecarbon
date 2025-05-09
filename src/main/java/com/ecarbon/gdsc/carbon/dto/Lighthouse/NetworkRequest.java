package com.ecarbon.gdsc.carbon.dto.Lighthouse;

import lombok.*;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class NetworkRequest {

    private String url;
    private String resourceType;
    private long resourceSize;
    private long transferSize;

}