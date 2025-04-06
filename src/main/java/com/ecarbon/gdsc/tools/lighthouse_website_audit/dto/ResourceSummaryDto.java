package com.ecarbon.gdsc.tools.lighthouse_website_audit.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.bson.Document;

@Getter
@Setter
@ToString
@AllArgsConstructor
public class ResourceSummaryDto {
    private String resourceType;
    private int requestCount;
    private long transferSize;

    public Document toDocument() {
        return new Document()
                .append("resourceType", resourceType)
                .append("requestCount", requestCount)
                .append("transferSize", transferSize);
    }
}
