package com.ecarbon.gdsc.tools.lighthouse_website_audit.util;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class MongoDBConnector {
    private static MongoClient mongoClient;

    private MongoDBConnector() {
        // private 생성자로 인스턴스화 방지
    }

    public static synchronized MongoClient getMongoClient(String connectionString) {
        if (mongoClient == null) {
            mongoClient = MongoClients.create(
                    MongoClientSettings.builder()
                            .applyConnectionString(new ConnectionString(connectionString))
                            .build()
            );
            log.info("✅ MongoDB 연결 생성 완료");
        }
        return mongoClient;
    }
}
