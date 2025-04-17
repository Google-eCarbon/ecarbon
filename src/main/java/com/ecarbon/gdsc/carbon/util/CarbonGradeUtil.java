package com.ecarbon.gdsc.carbon.util;

import org.springframework.stereotype.Component;

@Component
public class CarbonGradeUtil {
    public static String calculateGrade(double totalSizeKb){
        if (totalSizeKb <= 272.51) {
            return "A+";
        } else if (totalSizeKb <= 531.15) {
            return "A";
        } else if (totalSizeKb <= 975.85) {
            return "B";
        } else if (totalSizeKb <= 1410.39) {
            return "C";
        } else if (totalSizeKb <= 1875.01) {
            return "D";
        } else if (totalSizeKb <= 2419.56) {
            return "E";
        } else {
            return "F";
        }
    }
}
