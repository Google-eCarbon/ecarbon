package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.dto.EmissionResult;
import com.ecarbon.gdsc.carbon.dto.EmissionRequest;
import org.springframework.stereotype.Service;

/**
웹 페이지 탄소 배출량 추정 계산식
*/
@Service
public class EmissionsCalculator {

    // carbon Intensity (gCO2e/kWh)
    private static final double KOREA_AVERAGE_INTENSITY = 407.0;
    private static final double WORLD_AVERAGE_INTENSITY = 494.0;

    // OPERATION WATT (kWh/GB)
    private static final double ELECTRICITY_DATA_CENTER_O = 0.055;
    private static final double ELECTRICITY_NETWORK_O = 0.059;
    private static final double ELECTRICITY_USER_DEVICE = 0.080;

    // EMBODIED WATT (kWh/GB)
    private static final double ELECTRICITY_EMBODIED = 0.012;
    private static final double ELECTRICITY_EMBODIED_NETWORK = 0.013;
    private static final double ELECTRICITY_EMBODIED_USER_DEVICE = 0.081;

    // calculateOperationEmissions()
    private static EmissionResult calculateOperationEmissions(double dataTransmissionTraffic){
        double datacenter = dataTransmissionTraffic * ELECTRICITY_DATA_CENTER_O * KOREA_AVERAGE_INTENSITY;
        double network = dataTransmissionTraffic * ELECTRICITY_NETWORK_O * KOREA_AVERAGE_INTENSITY;
        double userDevice = dataTransmissionTraffic * ELECTRICITY_USER_DEVICE * KOREA_AVERAGE_INTENSITY;

        return EmissionResult.builder()
                .datacenter(datacenter)
                .network(network)
                .userDevice(userDevice)
                .build();
    }

    // calculateEmbodiedEmissions()
    private static EmissionResult calculateEmbodiedEmissions(double dataTransmissionTraffic){
        double embodied = dataTransmissionTraffic * ELECTRICITY_EMBODIED * KOREA_AVERAGE_INTENSITY;
        double network = dataTransmissionTraffic * ELECTRICITY_EMBODIED_NETWORK * KOREA_AVERAGE_INTENSITY;
        double userDevice = dataTransmissionTraffic * ELECTRICITY_EMBODIED_USER_DEVICE * KOREA_AVERAGE_INTENSITY;

        return EmissionResult.builder()
                .datacenter(embodied)
                .network(network)
                .userDevice(userDevice)
                .build();
    }

    // adjustForGreenHosting()
    private static double adjustForGreenHosting(double datacenterEmission, double greenHostFactor){
        return datacenterEmission * (1 - greenHostFactor);
    }


    // estimateEmissionPerPage()
    public double estimateEmissionPerPage(EmissionRequest request){

        EmissionResult opEmissions = calculateOperationEmissions(request.getDataGb());
        EmissionResult emEmissions = calculateEmbodiedEmissions(request.getDataGb());

        double opDcAdjusted = adjustForGreenHosting(opEmissions.getDatacenter(), request.getGreenHostFactor());

        double totalSegmentEmission = (
                (opDcAdjusted + emEmissions.getDatacenter())
                + (opEmissions.getNetwork() + emEmissions.getNetwork())
                + (opEmissions.getUserDevice() + emEmissions.getUserDevice())
        );

        double newVisitorEmission = totalSegmentEmission * request.getNewVisitorRatio();

        double returnVisitorEmission = totalSegmentEmission
                * request.getReturnVisitorRatio()
                * (1 - request.getDataCacheRatio());

        return newVisitorEmission + returnVisitorEmission;
    }
}
