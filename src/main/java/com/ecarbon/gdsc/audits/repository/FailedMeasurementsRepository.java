package com.ecarbon.gdsc.audits.repository;

import com.ecarbon.gdsc.audits.entity.FailedUserMeasurements;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

@Repository
@Slf4j
public class FailedMeasurementsRepository {

    private static final String COLLECTION_NAME = "failed_measurements";

    /**
     * 실패한 측정 데이터를 Firestore에 저장
     *
     * @param failed 실패한 측정 데이터
     */
    public void save(FailedUserMeasurements failed) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection(COLLECTION_NAME).add(failed);
            log.info("[🔥 FIREBASE] 💾 Failed measurement saved for URL: {}", failed.getUrl());
        } catch (Exception e) {
            log.error("[🔥 FIREBASE] ❌ Failed to save failed measurement for URL: {}", failed.getUrl(), e);
        }
    }
}