package com.ecarbon.gdsc.carbon;

import com.ecarbon.gdsc.carbon.dto.EmissionRequest;
import com.ecarbon.gdsc.carbon.service.CarbonCalculator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

public class EmissionsCalculatorTest {
    private final CarbonCalculator calculator = new CarbonCalculator();

    @Test
    void testEstimateEmissionPerPage_basicScenario(){
        // given
        EmissionRequest request = EmissionRequest.builder()
                .dataGb(1.0)
                .newVisitorRatio(1.0) // 전부 신규 방문자
                .returnVisitorRatio(0.0) // 재방문 없음
                .dataCacheRatio(0.0) // 캐시 없음
                .greenHostFactor(0.0) // 그린호스팅 없음
                .build();

        // when
        double result = calculator.estimateEmissionPerPage(request);

        // then
        System.out.println("배출량(gCo2e): " + result);
        assertThat(result).isGreaterThan(0);

    }

    @Test
    void testEstimateEmissionPerPage_withGreenHostingAndCache() {
        EmissionRequest request = EmissionRequest.builder()
                .dataGb(1.0)
                .newVisitorRatio(0.5)
                .returnVisitorRatio(0.5)
                .dataCacheRatio(0.6)
                .greenHostFactor(0.8) // 80% green
                .build();

        double result = calculator.estimateEmissionPerPage(request);
        System.out.println("배출량(gCO2e) with green hosting + cache: " + result);
        assertThat(result).isGreaterThan(0);
    }
}

