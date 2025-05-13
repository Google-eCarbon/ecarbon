package com.ecarbon.gdsc.carbon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RankingResponse {

    private String updatedAt;
    private List<TopEmissionPlace> topEmissionPlaces;

}
