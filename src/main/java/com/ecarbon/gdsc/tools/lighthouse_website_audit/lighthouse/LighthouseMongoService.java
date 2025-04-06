package com.ecarbon.gdsc.tools.lighthouse_website_audit.lighthouse;

import com.ecarbon.gdsc.tools.lighthouse_website_audit.dto.PlaceDetails;
import com.ecarbon.gdsc.tools.lighthouse_website_audit.dto.LighthouseResultDto;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
public class LighthouseMongoService {
    private static volatile LighthouseMongoService instance;                 // 싱글톤 인스턴스
    private final MongoCollection<Document> resourceCollection;     // 리소스 데이터 컬렉션
    private final MongoCollection<Document> trafficCollection;      // 트래픽 데이터 컬렉션
    private final MongoCollection<Document> unusedCollection;       // 미사용 데이터 컬렉션
    private final MongoCollection<Document> errorCollection;        // 오류 로그 컬렉션

    // 생성자: MongoDB 컬렉션 초기화
    private LighthouseMongoService(MongoClient mongoClient, String databaseName) {
        MongoDatabase database = mongoClient.getDatabase(databaseName);
        this.resourceCollection = database.getCollection("resource_data");
        this.trafficCollection = database.getCollection("traffic_data");
        this.unusedCollection = database.getCollection("unused_data");
        this.errorCollection = database.getCollection("error_logs");
    }

    // 싱글톤 인스턴스 반환 메서드
    public static LighthouseMongoService getInstance(MongoClient mongoClient, String databaseName) {
        if (instance == null) {
            synchronized (LighthouseMongoService.class) {
                if (instance == null) {
                    instance = new LighthouseMongoService(mongoClient, databaseName);
                    log.info("✅ LighthouseMongoService 인스턴스 생성 완료");
                }
            }
        }
        return instance;
    }

    // Lighthouse 결과 데이터를 MongoDB에 저장하는 메서드
    public void saveLighthouseData(LighthouseResultDto result, PlaceDetails placeDetails) {
        try {
            // 네트워크 요청 데이터가 비어 있는 경우 오류 로그 저장
            if (result.getNetworkRequests().isEmpty()) {
                log.error("⚠️ 네트워크 요청 데이터 없음: " + result.getUrl());
                errorCollection.insertOne(new Document()
                        .append("url", result.getUrl())
                        .append("error", "Network requests empty")
                        .append("type", "empty_network_requests")
                        .append("timestamp", new Date()));
                return;
            }

            // 네트워크 요청 데이터를 Document로 변환
            List<Document> networkRequestDocs = result.getNetworkRequests().stream()
                    .map(nr -> nr.toDocument())
                    .collect(Collectors.toList());

            // 리소스 요약 데이터를 Document로 변환
            List<Document> resourceSummaryDocs = result.getResourceSummary().stream()
                    .map(rs -> rs.toDocument())
                    .collect(Collectors.toList());

            // 리소스 데이터 저장
            Document resourceDoc = new Document()
                    .append("url", result.getUrl())
                    .append("network_request", networkRequestDocs)
                    .append("placeDetails", placeDetails.toDocument())
                    .append("timestamp", new Date());
            resourceCollection.insertOne(resourceDoc);

            // 트래픽 데이터 저장
            Document trafficDoc = new Document()
                    .append("url", result.getUrl())
                    .append("resource_summary", resourceSummaryDocs)
                    .append("placeDetails", placeDetails.toDocument())
                    .append("timestamp", new Date());
            trafficCollection.insertOne(trafficDoc);

            // 미사용 데이터 저장
            Document unusedDoc = new Document()
                    .append("url", result.getUrl())
                    .append("unused_data", result.getUnusedData().toDocument())
                    .append("placeDetails", placeDetails.toDocument())
                    .append("timestamp", new Date());
            unusedCollection.insertOne(unusedDoc);

            log.info("✅ 데이터 저장 완료: " + result.getUrl());

        } catch (Exception e) {
            log.error("❌ MongoDB 저장 중 오류 발생: " + result.getUrl());
            e.printStackTrace();
            // 오류 로그 저장
            errorCollection.insertOne(new Document()
                    .append("url", result.getUrl())
                    .append("error", e.getMessage())
                    .append("type", "mongodb_error")
                    .append("timestamp", new Date()));
        }
    }
}
