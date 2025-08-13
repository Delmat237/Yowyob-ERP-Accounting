package com.yowyob.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableCaching
@EnableKafka
@EnableAsync
@EnableTransactionManagement
public class YowyobErpBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(YowyobErpBackendApplication.class, args);
    }
}
