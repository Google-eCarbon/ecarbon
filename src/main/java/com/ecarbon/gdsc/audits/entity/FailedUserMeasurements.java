package com.ecarbon.gdsc.audits.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


@Document(collection = "failed_measurements")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FailedUserMeasurements {
    @Id
    private String id;
    private String url;
    private String measuredAt;
    private String weekStartDate;
    private String errorMessage;
}