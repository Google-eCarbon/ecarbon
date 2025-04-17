package com.ecarbon.gdsc.carbon.repository;

import com.ecarbon.gdsc.carbon.entity.WeeklyMeasurements;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WeeklyMeasurementsRepository extends MongoRepository<WeeklyMeasurements, String> {
    Optional<WeeklyMeasurements> findByUrl(String url);
}
