package com.ecarbon.gdsc.audits.util;

import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;

@Component
public class DateCalculator {

    public static String getMondayAsString(LocalDateTime dateTime) {

        LocalDate monday = dateTime.toLocalDate()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        return monday.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
