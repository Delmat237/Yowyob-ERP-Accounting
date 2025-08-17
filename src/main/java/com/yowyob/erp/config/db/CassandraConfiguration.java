package com.yowyob.erp.config.db;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import com.datastax.oss.driver.api.core.CqlSession;

@Configuration
public class CassandraConfiguration {

    @Value("${spring.cassandra.keyspace-name}") 
    private String keyspaceName;

    @Value("${spring.cassandra.local-datacenter}") 
    private String localDatacenter;


    public CqlSession session() {
        return CqlSession.builder()
                .withKeyspace(keyspaceName)
                .withLocalDatacenter(localDatacenter)
                .build();
    }
}
