package com.ecarbon.gdsc.carbon.repository;

import com.ecarbon.gdsc.carbon.dto.Lighthouse.TrafficData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TrafficDataRepository extends MongoRepository<TrafficData, String> {
    Optional<TrafficData> findByUrl(String url);
}
