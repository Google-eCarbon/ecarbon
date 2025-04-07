package com.ecarbon.gdsc.tools.lighthouse_website_audit;

import com.ecarbon.gdsc.tools.lighthouse_website_audit.dto.PlaceDetails;
import com.ecarbon.gdsc.tools.lighthouse_website_audit.lighthouse.LighthouseMongoService;
import com.ecarbon.gdsc.tools.lighthouse_website_audit.lighthouse.LighthouseWorker;
import com.ecarbon.gdsc.tools.lighthouse_website_audit.util.MongoDBConnector;
import com.ecarbon.gdsc.tools.lighthouse_website_audit.util.ProgressManager;
import com.ecarbon.gdsc.tools.lighthouse_website_audit.util.UrlManager;
import com.mongodb.client.MongoClient;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
public class Main {

    private static final String CONNECTION_STRING = "mongodb://localhost:27017";                // MongoDB 연결 문자열
    private static final String DB_NAME = "eCarbon";                                       // DB명
    private static final String INPUT_FILE = "src/main/java/com/ecarbon/gdsc/tools/univ_details_fetcher/data/processed/place_details.json";                   // 입력 파일 이름
    private static final int THREAD_COUNT = getOptimalThreadCount();                                 // 사용할 스레드 수
    private static final AtomicInteger completedCount = new AtomicInteger(0);     // 완료된 작업 수
    private static final AtomicLong totalExecutionTime = new AtomicLong(0);       // 총 실행 시간
    private static int totalTasks;

    public static void main(String[] args) {
        long startTime = System.currentTimeMillis(); // 실행 시작 시간

        // MongoDB 싱글톤 연결 생성
        MongoClient mongoClient = MongoDBConnector.getMongoClient(CONNECTION_STRING);
        if (mongoClient == null) {
            log.error("MongoDB 연결 실패");
            return;
        }
        LighthouseMongoService mongoService = LighthouseMongoService.getInstance(mongoClient, DB_NAME);

        // 마지막으로 처리된 인덱스 가져오기
        int lastProcessedIndex = ProgressManager.loadProgress();
        log.info("마지막으로 처리된 인덱스: {}", lastProcessedIndex);

        // 전체 작업 목록 로드 후 진행된 인덱스 이후의 데이터만 선택
        List<PlaceDetails> allTasks = UrlManager.filterValidInstitutions(INPUT_FILE);
        List<PlaceDetails> pendingTasks = allTasks.subList(Math.min(lastProcessedIndex, allTasks.size()), allTasks.size());
//        List<PlaceDetails> pendingTasks = allTasks.subList(
//                Math.min(lastProcessedIndex, allTasks.size()),
//                Math.min(lastProcessedIndex + 20, allTasks.size())
//        );
        totalTasks = pendingTasks.size();

        LinkedBlockingQueue<PlaceDetails> queue = new LinkedBlockingQueue<>(pendingTasks);

        // 스레드 풀 생성 -> 스레드 관리
        ExecutorService executorService = Executors.newFixedThreadPool(THREAD_COUNT);

        // 각 스레드에 작업 할당
        for (int i = 0; i < THREAD_COUNT; i++) {
            executorService.submit(() -> {
                try {
                    long threadStartTime = System.currentTimeMillis();
                    new LighthouseWorker(queue, mongoService, completedCount, totalTasks).run();
                    long elapsedTime = System.currentTimeMillis() - threadStartTime;
                    totalExecutionTime.addAndGet(elapsedTime);
                } catch (Exception e) {
                    log.error("작업 수행 중 오류 발생", e);
                }
            });
        }

        // 스레드 풀 종료
        executorService.shutdown();

        try {
            executorService.awaitTermination(Long.MAX_VALUE, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            log.error("스레드 종료 대기 중 오류 발생", e);
        }

        long endTime = System.currentTimeMillis(); // 실행 종료 시간
        long totalElapsedTime = endTime - startTime;
        double averageExecutionTime = (double) totalExecutionTime.get() / totalTasks;

        log.info("\uD83D\uDD56 총 실행 시간: {}ms", totalElapsedTime);
        log.info("\uD83D\uDD56 평균 작업 실행 시간: {}ms", averageExecutionTime);

        // 모든 작업이 완료되면 진행 상태 파일 초기화
        ProgressManager.resetProgress();
    }

    // 사용 가능한 코어 수 반환
    private static int getNumberOfCores() {
        return Runtime.getRuntime().availableProcessors();
    }

    // 효율적인 스레드 개수를 반환하는 메서드
    private static int getOptimalThreadCount() {
        // 사용 가능한 프로세서 코어 수 가져오기
        int availableProcessors = Runtime.getRuntime().availableProcessors();
        // Lighthouse는 리소스를 많이 사용하므로 코어 수보다 약간 적게 설정
        return Math.max(1, availableProcessors - 2);
    }
}
