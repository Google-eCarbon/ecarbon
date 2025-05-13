package com.ecarbon.gdsc.auth.dto;

import com.ecarbon.gdsc.auth.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class UserPageResponse {

    private List<DateReductionBytes> reduction_bytes_graph;

    private List<DateReductionCount> reduction_count_graph;

    private long total_reduction_bytes;
    private long total_reduction_count;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class DateReductionCount {
        private String date;
        private long count;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class DateReductionBytes {
        private String date;
        private long reductionByte;
    }
}
