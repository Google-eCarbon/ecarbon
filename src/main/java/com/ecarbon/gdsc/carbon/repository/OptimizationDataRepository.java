package com.ecarbon.gdsc.carbon.repository;

import com.ecarbon.gdsc.carbon.dto.Lighthouse.OptimizationData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OptimizationDataRepository extends MongoRepository<OptimizationData, String> {
    Optional<OptimizationData> findByUrl(String url);
}
