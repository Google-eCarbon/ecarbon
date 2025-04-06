package com.ecarbon.gdsc.tools.lighthouse_website_audit.util;

import java.io.*;
import java.util.logging.Logger;

public class ProgressManager {
    private static final String PROGRESS_FILE = "src/main/java/com/ecarbon/gdsc/tools/lighthouse_website_audit/data/progress.txt";  // 진행 상태 파일 경로

    // 마지막 진행 상태 저장
    public static void saveProgress(int lastProcessedIndex) {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(PROGRESS_FILE))) {
            writer.write(String.valueOf(lastProcessedIndex));  // 마지막 인덱스를 저장
        } catch (IOException e) {
            Logger.getLogger(ProgressManager.class.getName()).warning("Progress saving failed: " + e.getMessage());
        }
    }

    // 마지막 진행 상태 읽기
    public static int loadProgress() {
        File progressFile = new File(PROGRESS_FILE);
        if (!progressFile.exists()) {
            return 0;  // 첫 실행인 경우 0부터 시작
        }
        try (BufferedReader reader = new BufferedReader(new FileReader(progressFile))) {
            String line = reader.readLine();
            return Integer.parseInt(line);  // 마지막으로 처리된 인덱스를 반환
        } catch (IOException | NumberFormatException e) {
            Logger.getLogger(ProgressManager.class.getName()).warning("Progress loading failed: " + e.getMessage());
            return 0;  // 읽기 실패 시 0부터 시작
        }
    }

    // 진행 상태를 0으로 초기화
    public static void resetProgress() {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(PROGRESS_FILE))) {
            writer.write("0");  // 진행 상태를 0으로 초기화
        } catch (IOException e) {
            Logger.getLogger(ProgressManager.class.getName()).warning("Progress reset failed: " + e.getMessage());
        }
    }
}

