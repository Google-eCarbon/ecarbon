package com.ecarbon.gdsc.carbon.repository;

import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WeeklyMeasurementsRepository extends MongoRepository<WeeklyMeasurements, String> {
    Optional<WeeklyMeasurements> findTopByUrlOrderByMeasuredAtDesc(String url);

    @Aggregation(pipeline = {
            "{ $match: { 'weekStartDate': ?0, 'placeInfo.category': ?1 } }",
            "{ $sort: { 'carbonEmission': 1 } }",
            "{ $limit: ?2 }"
    })
    List<WeeklyMeasurements> findLowestCarbonEmissions(String weekStartDate, String category, int limit);
}
