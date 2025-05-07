package com.ecarbon.gdsc.carbon.repository;

import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Repository
public class FirebaseWeeklyMeasurementRepository {

    private static final String COLLECTION_NAME = "weekly_measurements";

    public List<WeeklyMeasurements> findByWeekStartDateAndCategory(String weekStartDate, String category)
            throws ExecutionException, InterruptedException {

        Firestore db = FirestoreClient.getFirestore();

        Query query = db.collection(COLLECTION_NAME)
                .whereEqualTo("weekStartDate", weekStartDate)
                .whereEqualTo("placeInfo.category", category);

        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();

        return docs.stream()
                .map(doc -> doc.toObject(WeeklyMeasurements.class))
                .collect(Collectors.toList());
    }

    public WeeklyMeasurements findLatestByUrl(String url)
            throws ExecutionException, InterruptedException {

        Firestore db = FirestoreClient.getFirestore();

        Query query = db.collection(COLLECTION_NAME)
                .whereEqualTo("url", url)
                .orderBy("measuredAt", Query.Direction.DESCENDING)
                .limit(1);

        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();

        if (docs.isEmpty()) return null;
        return docs.get(0).toObject(WeeklyMeasurements.class);
    }

    public List<WeeklyMeasurements> findLatestUniqueByWeekStartDateAndCategory(String weekStartDate, String category)
            throws ExecutionException, InterruptedException {

        Firestore db = FirestoreClient.getFirestore();

        // 1. weekStartDate, category, carbonEmission ≠ 0.0 조건 필터
        Query query = db.collection("weekly_measurements")
                .whereEqualTo("weekStartDate", weekStartDate)
                .whereEqualTo("placeInfo.category", category)
                .whereNotEqualTo("carbonEmission", 0.0);

        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        // 2. 문서 객체로 매핑
        List<WeeklyMeasurements> all = documents.stream()
                .map(doc -> doc.toObject(WeeklyMeasurements.class))
                .filter(wm -> wm.getCarbonEmission() != 0.0)
                .sorted(Comparator.comparing(WeeklyMeasurements::getMeasuredAt).reversed())
                .collect(Collectors.toList());

        // 3. url 기준 중복 제거: 가장 최근 것만 유지
        Map<String, WeeklyMeasurements> uniqueByUrl = new LinkedHashMap<>();
        for (WeeklyMeasurements wm : all) {
            uniqueByUrl.putIfAbsent(wm.getUrl(), wm);
        }

        return new ArrayList<>(uniqueByUrl.values());
    }
}