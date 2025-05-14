package com.ecarbon.gdsc.audits.lighthouse;

import com.ecarbon.gdsc.audits.MainRunner;
import com.ecarbon.gdsc.audits.entity.Measurements;
import com.ecarbon.gdsc.audits.repository.FirebaseUserMeasurementsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class LighthouseAuditService {

    private final MainRunner mainRunner;
    private final FirebaseUserMeasurementsRepository measurementsRepository;

    public Measurements startAudit(String url) throws InterruptedException {
        mainRunner.addUrlToQueue(url);
        log.info("Added URL to measurement queue: {}", url);
        mainRunner.runAudit();
        log.info("Started Lighthouse measurement for URL: {}", url);
        return measurementsRepository.findLatestByUrl(url);
    }

}
