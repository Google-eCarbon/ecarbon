package com.ecarbon.gdsc;


import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@SpringBootTest
public class MongoConnectionTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Test
    void insertOneSimpleDocument() {

        // given
        Document doc = new Document();
        doc.put("message", "Hello MongoDB!");
        doc.put("createdAt", System.currentTimeMillis());

        // when
        mongoTemplate.getCollection("testCollection").insertOne(doc);

        // then
        Document result = mongoTemplate.getCollection("testCollection")
                .find(new Document("message", "Hello MongoDB!")).first();

        assertThat(result).isNotNull();
        System.out.println("✅ 저장된 문서: " + result.toJson());
    }
}
