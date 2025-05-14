package com.ecarbon.gdsc.audits.repository;

import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.api.core.ApiFuture;
import com.ecarbon.gdsc.audits.entity.Measurements;
import com.ecarbon.gdsc.audits.entity.FailedUserMeasurements;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.time.format.DateTimeFormatter;

@Repository
@Slf4j
public class FirebaseUserMeasurementsRepository {

    private static final String COLLECTION_NAME = "user_measurements";
    private static final String FAILED_COLLECTION_NAME = "failed_measurements";
    private static final DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;


    public Measurements findLatestByUrl(String url) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            
            // url로만 필터링하여 모든 문서 조회
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("url", url)
                    .get();

            QuerySnapshot snapshot = future.get();
            
            if (snapshot.isEmpty()) {
                return null;
            }

            // 클라이언트 측에서 measuredAt 기준으로 정렬
            return snapshot.getDocuments().stream()
                    .map(doc -> doc.toObject(Measurements.class))
                    .max(Comparator.comparing(Measurements::getMeasuredAt))
                    .orElse(null);
            
        } catch (Exception e) {
            log.error("Error fetching latest measurements for URL: " + url, e);
            return null;
        }
    }


    /**
     * 측정된 데이터를 Firestore에 저장
     *
     * @param measurements 저장할 측정 데이터
     */
    public String save(Measurements measurements) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            String docId = db.collection(COLLECTION_NAME).add(measurements).get().getId();
            log.info("[🔥 FIREBASE] 💾 Saved measurement with ID: {}", docId);
            return docId;
        } catch (Exception e) {
            log.error("[🔥 FIREBASE] ❌ Failed to save measurement: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save measurement", e);
        }
    }

    /**
     * 실패한 측정 데이터를 Firestore에 저장
     *
     * @param failed 실패한 측정 데이터
     */
    public void saveFailedMeasurement(FailedUserMeasurements failed) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<WriteResult> future = db.collection(FAILED_COLLECTION_NAME).document().create(failed);
            future.get();
            log.info("[🔥 FIREBASE] 💾 Failed measurement saved for URL: {}", failed.getUrl());
        } catch (Exception e) {
            log.error("[🔥 FIREBASE] ❌ Error saving failed measurement for URL: {}", failed.getUrl(), e);
            throw new RuntimeException("Failed to save failed measurement", e);
        }
    }
}
