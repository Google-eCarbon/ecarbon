package com.ecarbon.gdsc.audits.lighthouse;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class LighthouseRunner {
    private static final String LIGHTHOUSE_PATH = System.getenv("LIGHTHOUSE_PATH");
    private static final List<String> CHROME_FLAGS = Arrays.asList(
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-extensions",
            "--disable-background-networking",
            "--enable-features=NetworkServiceInProcess"
    );

    private static List<String> buildLighthouseCommand(String url) {
        return Arrays.asList(
                LIGHTHOUSE_PATH,
                url,
                "--output=json",
                "--quiet",
                "--only-audits=" +
                        "network-requests,resource-summary,total-byte-weight," +
                        "unused-css-rules,unused-javascript,modern-image-formats," +
                        "efficient-animated-content,third-party-summary,duplicated-javascript," +
                        "script-treemap-data",
                "--max-wait-for-load=25000",
                "--throttling-method=provided",
                "--screenEmulation.disabled",
                "--no-emulatedUserAgent",
                "--chrome-flags=" + String.join(" ", CHROME_FLAGS)
        );
    }
    
    public static JsonNode runLighthouseJsonNode(String url){
        long startTime = System.currentTimeMillis();
        Process process = null;

        try {
            List<String> command = buildLighthouseCommand(url);
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(true);

            process = processBuilder.start();
            String output = collectProcessOutput(process);

            if (!process.waitFor(120, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                log.error("[LIGHTHOUSE/RUNNER] ⚠️ Process timeout for URL: {}", url);
                return null;
            }

            logExecutionTime(url, startTime);

            ObjectMapper mapper = new ObjectMapper();
            return mapper.readTree(output);

        } catch (Exception e) {
            log.error("[LIGHTHOUSE/RUNNER] ❌ Exception while running Lighthouse for URL: {}", url, e);
            return null;

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
            log.error("[LIGHTHOUSE/RUNNER] 🚨 Execution error: {}", errorOutput);
        }

        return output.toString();
    }

    private static void logExecutionTime(String url, long startTime) {
        long elapsedTime = System.currentTimeMillis() - startTime;
        log.info("[LIGHTHOUSE/RUNNER] ✅ Finished: {} | Time: {}ms ({}s)", url, elapsedTime, elapsedTime / 1000.0);
    }

}