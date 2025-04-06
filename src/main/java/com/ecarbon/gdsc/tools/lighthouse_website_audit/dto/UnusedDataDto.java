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
public class UnusedDataDto {
    private String url;
    private UnusedMetricDto unusedJavascript;
    private UnusedMetricDto unusedCssRules;
    private UnusedMetricDto modernImageFormats;

    // MongoDB Document로 변환
    public Document toDocument() {
        return new Document()
                .append("url", url)
                .append("unused_javascript", unusedJavascript.toDocument())
                .append("unused_css_rules", unusedCssRules.toDocument())
                .append("modern_image_formats", modernImageFormats.toDocument());
    }
}
