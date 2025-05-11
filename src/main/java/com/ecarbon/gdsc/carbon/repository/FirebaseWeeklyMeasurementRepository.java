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

    /**
     * 특정 url에 해당하는 모든 데이터를 Firestore에서 조회 (인덱스 필요 없음)
     * @param url
     * @return List<WeeklyMeasurements>
     * @throws ExecutionException
     * @throws InterruptedException
     */
    public List<WeeklyMeasurements> findAllByUrl(String url)
            throws ExecutionException, InterruptedException {

        Firestore db = FirestoreClient.getFirestore();

        // 단일 필드 필터링만 사용하여 인덱스 필요 없게 함
        Query query = db.collection(COLLECTION_NAME)
                .whereEqualTo("url", url);

        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();

        return docs.stream()
                .map(doc -> doc.toObject(WeeklyMeasurements.class))
                .collect(Collectors.toList());
    }

    /**
     * 특정 url에 해당하는 데이터 중 가장 최근(measuredAt 기준) 데이터를 Firestore에서 조회
     * Firestore 인덱스 필요: (url ASC, measuredAt DESC) 또는 (url DESC, measuredAt DESC)
     * @param url
     * @return Optional<WeeklyMeasurements>
     * @throws ExecutionException
     * @throws InterruptedException
     */
    public List<WeeklyMeasurements> findTopByUrlOrderByMeasuredAtDesc(String url)
            throws ExecutionException, InterruptedException {

        Firestore db = FirestoreClient.getFirestore();

        Query query = db.collection(COLLECTION_NAME)
                .whereEqualTo("url", url)
                .orderBy("measuredAt", Query.Direction.DESCENDING)
                .limit(1);

        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();

        return docs.stream()
                .map(doc -> doc.toObject(WeeklyMeasurements.class))
                .collect(Collectors.toList());
    }


    /**
     * 주어진 weekStartDate와 category에 해당하는 데이터를 Firestore에서 조회
     * Firestore 인덱스 필요: (weekStartDate ASC, placeInfo.category ASC) 또는 조합에 따라 다름
     * @param weekStartDate
     * @param category
     * @return List<WeeklyMeasurements>
     * @throws ExecutionException
     * @throws InterruptedException
     */
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

    /**
     * 특정 url에 해당하는 데이터 중 가장 최근(measuredAt 기준) 데이터를 Firestore에서 조회
     * Firestore 인덱스 필요: (url ASC, measuredAt DESC) 또는 (url DESC, measuredAt DESC)
     * @param url
     * @return WeeklyMeasurements
     * @throws ExecutionException
     * @throws InterruptedException
     */
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

    /**
     * 주어진 weekStartDate와 category에 해당하는 데이터 중, carbonEmission이 0이 아닌 데이터를 조회
     * 조회된 데이터를 measuredAt 기준으로 정렬한 후, url을 기준으로 중복을 제거하여 가장 최근 데이터만 유지
     * @param weekStartDate
     * @param category
     * @return List<WeeklyMeasurements>
     * @throws ExecutionException
     * @throws InterruptedException
     */
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

        // 2. 문서 객체로 매핑 및 정렬 (carbonEmission 필터는 Firestore에서 이미 수행됨)
        List<WeeklyMeasurements> all = documents.stream()
                .map(doc -> doc.toObject(WeeklyMeasurements.class))
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