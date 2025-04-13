package com.ecarbon.gdsc.carbon.repository;

import com.ecarbon.gdsc.carbon.dto.Lighthouse.ResourceData;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResourceDataRepository extends MongoRepository<ResourceData, String> {
    Optional<ResourceData> findByUrl(String url);
}
