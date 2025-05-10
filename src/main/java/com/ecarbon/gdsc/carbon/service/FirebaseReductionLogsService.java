package com.ecarbon.gdsc.carbon.service;

import com.ecarbon.gdsc.carbon.entity.ReductionLogs;
import com.ecarbon.gdsc.carbon.repository.FirebaseReductionLogsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;

@Service
@Slf4j
@RequiredArgsConstructor
public class FirebaseReductionLogsService {
    private final FirebaseReductionLogsRepository reductionLogsRepository;

    public ReductionLogs findByDomain(String domain) throws ExecutionException, InterruptedException {
        log.info("Fetching reduction logs from repository for domain: {}", domain);
        return reductionLogsRepository.findByDomain(domain);
    }
}
