package com.ecarbon.gdsc.audits;

import com.ecarbon.gdsc.audits.lighthouse.LighthouseDataExtractor;
import com.ecarbon.gdsc.audits.lighthouse.LighthouseDataWriter;
import com.ecarbon.gdsc.audits.lighthouse.LighthouseRunner;
import com.ecarbon.gdsc.audits.lighthouse.LighthouseWorker;
import com.ecarbon.gdsc.audits.entity.Measurements;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.*;

@Component
@Slf4j
public class MainRunner {

    private static final int THREAD_COUNT = 2;

    @Autowired
    private LighthouseDataExtractor extractor;

    @Autowired
    private LighthouseRunner runner;

    @Autowired
    private LighthouseDataWriter writer;

    private final LinkedBlockingQueue<String> urlQueue = new LinkedBlockingQueue<>();

    public void addUrlToQueue(String url) {
        try {
            urlQueue.put(url);
            log.info("[MAIN] ➕ Added URL to queue: {}", url);
        } catch (InterruptedException e) {
            log.error("[MAIN] ❌ Failed to add URL to queue: {}", url);
            Thread.currentThread().interrupt();
        }
    }

    public Measurements runAudit() throws InterruptedException {
        ExecutorService executorService = Executors.newFixedThreadPool(THREAD_COUNT);
        CompletableFuture<Measurements> resultFuture = new CompletableFuture<>();

        log.info("[MAIN] 🕐 Starting audit with {} threads", THREAD_COUNT);

        // 각 스레듀에 작업 할당
        for (int i = 0; i < THREAD_COUNT; i++) {
            executorService.submit(() -> {
                try {
                    Measurements result = new LighthouseWorker(extractor, runner, writer, urlQueue).run();
                    if (result != null) {
                        resultFuture.complete(result);
                    }
                } catch (Exception e) {
                    log.error("[MAIN] ❌ Error occurred while executing task", e);
                    resultFuture.completeExceptionally(e);
                }
            });
        }

        // ExecutorService 종료
        executorService.shutdown();
        try {
            // 최대 10분 대기
            if (!executorService.awaitTermination(10, TimeUnit.MINUTES)) {
                log.warn("[MAIN] ⚠️ Tasks did not complete in 10 minutes. Force shutting down...");
                executorService.shutdownNow();
                throw new InterruptedException("Tasks did not complete in 10 minutes");
            } else {
                log.info("[MAIN] ✅ All tasks completed successfully");
            }
        } catch (InterruptedException e) {
            log.error("[MAIN] ❌ Interrupted while waiting for tasks to complete", e);
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
            throw e;
        }

        try {
            return resultFuture.get(1, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.error("[MAIN] ❌ Failed to get measurement result", e);
            throw new InterruptedException("Failed to get measurement result");
        }
    }


}