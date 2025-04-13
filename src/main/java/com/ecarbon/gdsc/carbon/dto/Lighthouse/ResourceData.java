package com.ecarbon.gdsc.carbon.dto.Lighthouse;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

@Document(collection = "resource_data")
@Getter
@Builder
@ToString
public class ResourceData {

    @Id
    private String id;

    private String url;

    private String analyzedAt;

    @Field("network_request")
    private List<NetworkRequest> networkRequests;

}
