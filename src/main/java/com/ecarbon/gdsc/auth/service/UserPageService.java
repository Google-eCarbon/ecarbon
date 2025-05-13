package com.ecarbon.gdsc.auth.service;

import com.ecarbon.gdsc.auth.dto.UserPageResponse;
import com.ecarbon.gdsc.carbon.dto.ReductionLog;
import com.ecarbon.gdsc.carbon.entity.ReductionLogs;
import com.ecarbon.gdsc.carbon.repository.FirebaseReductionLogsRepository;
import com.ecarbon.gdsc.carbon.util.DateUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserPageService {

    private final FirebaseReductionLogsRepository firebaseReductionLogsRepository;

    public UserPageResponse getUserPage(String email) {
        log.info("사용자 페이지 데이터 요청 시작 - email: {}", email);

        try {
            List<ReductionLogs> logsList = firebaseReductionLogsRepository.findAllByEmail(email);

            long totalReductionBytes = calculateTotalReductionBytes(logsList);
            long totalContributionSize = calculateTotalContributionSize(logsList);
            List<UserPageResponse.DateReductionBytes> reductionBytesGraph = calculateDailyReductionBytes(logsList);
            List<UserPageResponse.DateReductionCount> reductionCountGraph = calculateDailyReductionCounts(logsList);

            log.info("총 절감 바이트: {}, 총 절감 건수: {}", totalReductionBytes, totalContributionSize);


            return UserPageResponse.builder()
                    .total_reduction_bytes(totalReductionBytes)
                    .total_reduction_count(totalContributionSize)
                    .reduction_bytes_graph(reductionBytesGraph)
                    .reduction_count_graph(reductionCountGraph)
                    .build();
        } catch (ExecutionException | InterruptedException e) {
            log.error("사용자 페이지 데이터 조회 중 오류 발생 - email: {}", email, e);

            throw new RuntimeException("Error fetching user page data", e);
        }
    }

    // 2. 전체 reduction_bytes 합
    private long calculateTotalReductionBytes(List<ReductionLogs> logsList) {
        long sum = logsList.stream()
                .mapToLong(ReductionLogs::getReduction_bytes)
                .sum();
        log.debug("총 reduction_bytes 합: {}", sum);
        return sum;
    }

    // 3. 전체 reduction_logs 길이 합
    private long calculateTotalContributionSize(List<ReductionLogs> logsList) {
        long sum = logsList.stream()
                .mapToLong(logs -> Optional.ofNullable(logs.getReduction_logs())
                        .map(List::size)
                        .orElse(0))
                .sum();
        log.debug("총 reduction_logs 건수 합: {}", sum);
        return sum;
    }

    // 4. 날짜별 reduction_bytes 합산
    private List<UserPageResponse.DateReductionBytes> calculateDailyReductionBytes(List<ReductionLogs> logsList) {
        Map<String, Long> dailyMap = new HashMap<>();
        for (ReductionLogs logs : logsList) {
            if (logs.getReduction_logs() == null) continue;
            for (ReductionLog log : logs.getReduction_logs()) {
                String date = DateUtil.extractDate(log.getTimestamp());
                dailyMap.put(date, dailyMap.getOrDefault(date, 0L) + log.getReduction_bytes());
            }
        }

        log.debug("날짜별 reduction_bytes: {}", dailyMap);

        return dailyMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> UserPageResponse.DateReductionBytes.builder()
                        .date(e.getKey())
                        .reductionByte(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    // 5. 날짜별 reduction_logs 수 카운트
    private List<UserPageResponse.DateReductionCount> calculateDailyReductionCounts(List<ReductionLogs> logsList) {
        Map<String, Long> countMap = new HashMap<>();
        for (ReductionLogs logs : logsList) {
            if (logs.getReduction_logs() == null) continue;
            for (ReductionLog log : logs.getReduction_logs()) {
                String date = DateUtil.extractDate(log.getTimestamp());
                countMap.put(date, countMap.getOrDefault(date, 0L) + 1);
            }
        }
        log.debug("날짜별 reduction_logs 수: {}", countMap);

        return countMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> UserPageResponse.DateReductionCount.builder()
                        .date(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }
}
