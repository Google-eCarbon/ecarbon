package com.ecarbon.gdsc.carbon.dto;

import com.google.cloud.firestore.annotation.PropertyName;
import lombok.*;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReductionLog {

    private String domain;

    private long original_size;

    private String original_url;

    private long reduction_bytes;

    private double reduction_percent;

    private boolean success;

    private String timestamp;

    private String webp_path;

    @PropertyName("webp_size")
    private long webp_size;
}
