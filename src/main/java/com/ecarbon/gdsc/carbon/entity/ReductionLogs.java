package com.ecarbon.gdsc.carbon.entity;

import com.ecarbon.gdsc.carbon.dto.ReductionLog;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Getter
@Setter
@Document(collection = "reduction_logs")
public class ReductionLogs {

    private String documentId;
    
    private String id; // email

    private String domain;

    private String original_url;

    private long original_size;

    private long reduction_bytes;

    private double reduction_percent;

    private boolean success;

    private String timestamp;

    private String webp_path;

    private long webp_size;

    private List<ReductionLog> reduction_logs;
}
