package com.ecarbon.gdsc.carbon.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CarbonEquivalents {
    private long coffeeCups;    // 커피 잔 수
    private long evKm;          // 전기차 주행 거리 (km)
    private long phoneCharges;  // 스마트폰 충전 횟수
    private long trees;         // 나무 흡수량 (그루 수)
}
