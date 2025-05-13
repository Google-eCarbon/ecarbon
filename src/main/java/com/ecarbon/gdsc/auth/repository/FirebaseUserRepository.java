package com.ecarbon.gdsc.auth.repository;

import com.ecarbon.gdsc.auth.entity.User;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.concurrent.ExecutionException;

@Slf4j
@Repository
public class FirebaseUserRepository {

    private static final String COLLECTION_NAME = "users";

    public User save(User user) throws ExecutionException, InterruptedException {
        Firestore firestore = FirestoreClient.getFirestore();
        
        String email = user.getEmail();
        // 이메일을 문서 ID로 사용
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(email);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (!document.exists()) {
            // 새 사용자인 경우 초기값 설정
            user.setId(email);  // 이메일을 ID로 설정
            user.setLevel(1);
//            user.setTotal_reduction_bytes(0L);
//            user.setTotal_reduction_count(0L);
            user.setUser_measurement_logs(new ArrayList<>());
            
            // Firestore에 저장
            docRef.set(user).get();
            log.info("New user created: {}", email);
        } else {
            log.info("User already exists: {}", email);
            user = document.toObject(User.class);
            if (user.getId() == null) {
                user.setId(email);  // 기존 사용자의 ID가 null인 경우 업데이트
                docRef.set(user).get();
            }
        }
        
        return user;
    }

    public User findByEmail(String email) throws ExecutionException, InterruptedException {
        Firestore firestore = FirestoreClient.getFirestore();
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(email);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            return document.toObject(User.class);
        }
        return null;
    }

    public void update(User user) throws ExecutionException, InterruptedException {
        Firestore firestore = FirestoreClient.getFirestore();
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(user.getEmail());
        docRef.set(user).get();
        log.info("User updated: {}", user.getEmail());
    }
}
