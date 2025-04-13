package com.ecarbon.gdsc.carbon.dto.Lighthouse;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

@Document(collection = "traffic_data")
@Getter
@Builder
public class TrafficData {

    @Id
    private String id;

    private String url;

    private String analyzedAt;

    @Field("resource_summary")
    private List<ResourceSummary> resourceSummaries;
}
