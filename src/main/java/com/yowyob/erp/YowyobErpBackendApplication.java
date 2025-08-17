package com.yowyob.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.data.cassandra.repository.config.EnableCassandraRepositories;

@SpringBootApplication
@EnableCaching
@EnableKafka
@EnableAsync
@EnableTransactionManagement
@EnableCassandraRepositories(basePackages = "com.yowyob.erp.accounting.repository")
public class YowyobErpBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(YowyobErpBackendApplication.class, args);
    }
}
