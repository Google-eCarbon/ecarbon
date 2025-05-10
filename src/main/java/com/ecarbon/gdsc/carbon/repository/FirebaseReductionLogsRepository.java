package com.ecarbon.gdsc.carbon.repository;

import com.ecarbon.gdsc.carbon.entity.ReductionLogs;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class FirebaseReductionLogsRepository {

    // 실제 Firestore 컬렉션 이름으로 변경해야 합니다.
    private static final String COLLECTION_NAME = "reduction_logs";

    public ReductionLogs findByDomain(String domain) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        // 'domain' 필드가 고유하거나 첫 번째 문서를 가져오려는 경우 .limit(1) 사용
        Query query = db.collection(COLLECTION_NAME)
                .whereEqualTo("domain", domain)
                .limit(1);

        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        if (documents.isEmpty()) {
            return null;
        }
        // 첫 번째 문서를 ReductionLogs 객체로 변환
        return documents.get(0).toObject(ReductionLogs.class);
    }
}
