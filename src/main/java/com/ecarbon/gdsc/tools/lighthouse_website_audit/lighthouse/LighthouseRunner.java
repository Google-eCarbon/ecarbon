package com.ecarbon.gdsc.tools.lighthouse_website_audit.lighthouse;

import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Slf4j
public class LighthouseRunner {
    private static final String LIGHTHOUSE_PATH = System.getenv("LIGHTHOUSE_PATH"); // Lighthouse 실행 경로

    public static String runLighthouse(String url) {
        long startTime = System.currentTimeMillis(); // 시작 시간 기록

        try {
            List<String> command = new ArrayList<>();
            command.add(LIGHTHOUSE_PATH);
            command.add(url);
            command.add("--output=json");
            command.add("--quiet");
            command.add("--only-categories=performance");
            command.add("--max-wait-for-load=5000");       // 로드 대기 시간 단축
            command.add("--throttling-method=provided");   // 스로틀링 비활성화
            command.add("--emulated-form-factor=none");    // 폼 팩터 에뮬레이션 비활성화
            command.add("--disable-storage-reset");        //

            command.add("--chrome-flags=" + String.join(" ",
                    "--headless",
                    "--disable-gpu",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disk-cache-dir=/tmp/lh-cache",
                    "--disk-cache-size=1073741824",
                    "--disable-extensions",
                    "--disable-background-networking",
                    "--enable-features=NetworkServiceInProcess",
                    "--user-data-dir=/tmp/chrome-profile"
            ));

            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();

            StringBuilder output = new StringBuilder();
            boolean jsonStarted = false;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {

                    if (!jsonStarted && line.trim().startsWith("{")) {
                        jsonStarted = true;
                    }
                    if (jsonStarted) {
                        output.append(line).append("\n");
                    }
                }
            }
            try {
                process.waitFor();
            } catch (InterruptedException e) {
                log.error("Lighthouse 프로세스 대기 중 오류 발생: " + e.getMessage());
                Thread.currentThread().interrupt(); // 인터럽트 상태를 복원
            }

            // 기존 코드에 추가
            StringBuilder errorOutput = new StringBuilder();
            try (BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                String line;
                while ((line = errorReader.readLine()) != null) {
                    errorOutput.append(line).append("\n");
                }
            }
            if (errorOutput.length() > 0) {
                log.error("🚨 Lighthouse 실행 오류: " + errorOutput);
            }

            long endTime = System.currentTimeMillis(); // 종료 시간 기록
            long elapsedTime = endTime - startTime; // 소요 시간 계산
            log.info("\uD83D\uDCA1 Lighthouse 실행 완료. 소요 시간: " + elapsedTime + "ms" + " (" + url + ")");

            return output.toString();

        } catch (Exception e) {
            log.error("🚨 오류 발생: {}", e.getMessage(), e);
            return "응답 데이터가 없습니다.";  // 예외가 발생한 경우에도 응답 데이터가 없음을 나타냄g
        }
    }
}