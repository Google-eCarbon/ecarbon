package com.ecarbon.gdsc.auth.entity;

import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.google.cloud.firestore.annotation.DocumentId;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @DocumentId
    private String id;

    private String email;

    private String name;

    private int level;

    private Long total_reduction_bytes;

    private Long total_reduction_count;

    private List<WeeklyMeasurements> user_measurement_logs;

}