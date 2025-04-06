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
public class UnusedMetricDto {
    private String displayValue;
    private double numericValue;

    public Document toDocument() {
        return new Document()
                .append("display_value", displayValue)
                .append("numeric_value", numericValue);
    }
}