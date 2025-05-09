package com.ecarbon.gdsc.carbon.util;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Component
public class DateUtil {

    public static String getWeeksMonday() {
        LocalDate now = LocalDate.now();
        return now.with(java.time.DayOfWeek.MONDAY)
                .format(DateTimeFormatter.ISO_DATE);
    }

    public static List<String> getPreviousMondays(int count) {

        List<String> mondays = new ArrayList<>();

        LocalDate now = LocalDate.now().with(java.time.DayOfWeek.MONDAY);

        for (int i = 0; i < count; i++) {
            LocalDate monday = now.minusWeeks(i);
            mondays.add(monday.format(DateTimeFormatter.ISO_DATE));
        }

        return mondays;
    }
}
