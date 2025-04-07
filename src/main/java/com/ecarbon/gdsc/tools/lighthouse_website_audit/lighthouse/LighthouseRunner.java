package com.ecarbon.gdsc.tools.lighthouse_website_audit.lighthouse;

import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
public class LighthouseRunner {
    private static final String LIGHTHOUSE_PATH = System.getenv("LIGHTHOUSE_PATH");
    private static final List<String> CHROME_FLAGS = Arrays.asList(
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
//            "--disable-dev-shm-usage",
//            "--disk-cache-dir=/tmp/lh-cache",
//            "--disk-cache-size=1073741824",
            "--disable-extensions",
            "--disable-background-networking",
            "--enable-features=NetworkServiceInProcess"
//            "--user-data-dir=/tmp/chrome-profile"
    );

    private static List<String> buildLighthouseCommand(String url) {
        return Arrays.asList(
                LIGHTHOUSE_PATH,
                url,
                "--output=json",
                "--quiet",
                "--only-categories=performance",
                "--max-wait-for-load=5000",
                "--throttling-method=provided",
                "--emulated-form-factor=none",
                "--disable-storage-reset",
                "--chrome-flags=" + String.join(" ", CHROME_FLAGS)
        );
    }

    public static String runLighthouse(String url) {

        long startTime = System.currentTimeMillis(); // 시작 시간 기록
        Process process = null;

        try {
            List<String> command = buildLighthouseCommand(url);
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(true);

            process = processBuilder.start();
            String output = collectProcessOutput(process);

            if (!process.waitFor(120, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                log.error("[LIGHTHOUSE] ⚠️ Process timeout for URL: {}", url);
                return "";
            }
            logExecutionTime(url, startTime);
            return output;
        } catch (Exception e) {
            log.error("[LIGHTHOUSE] ❌ Exception while running Lighthouse for URL: {}", url, e);
            return "";
        } finally {
            if (process != null && process.isAlive()) {
                process.destroyForcibly();
            }
        }
    }

    private static String collectProcessOutput(Process process) throws IOException {

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

        StringBuilder errorOutput = new StringBuilder();
        try (BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
            String line;
            while ((line = errorReader.readLine()) != null) {
                errorOutput.append(line).append("\n");
            }
        }

        if (errorOutput.length() > 0) {
            log.error("[LIGHTHOUSE] 🚨 Execution error: {}", errorOutput);
        }

        return output.toString();
    }

    private static void logExecutionTime(String url, long startTime) {
        long elapsedTime = System.currentTimeMillis() - startTime;
        log.info("[LIGHTHOUSE] ✅ Finished: {} | Time: {}ms ({}s)", url, elapsedTime, elapsedTime / 1000.0);
    }
}