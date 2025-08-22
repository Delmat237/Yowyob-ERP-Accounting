package com.yowyob.erp.config.redis;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.extern.slf4j.Slf4j;

@Configuration
@EnableCaching
@Slf4j
public class RedisConfig {

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisPort;

    @Value("${spring.data.redis.password}")
    private String redisPassword;

    @Value("${spring.data.redis.timeout}")
    private Duration redisTimeout;

    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(redisHost);
        config.setPort(redisPort);
        config.setPassword(redisPassword);
        //config.setConnectTimeout(redisTimeout);
        
        log.info("Connecting to Redis at {}:{} with timeout {}", redisHost, redisPort, redisTimeout.toMillis());
        return new LettuceConnectionFactory(config);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);
        
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        
        template.afterPropertiesSet();
        log.info("RedisTemplate configured with JSON serialization and timeout {}", redisTimeout.toMillis());
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMillis(600000)) // Aligné avec spring.cache.redis.time-to-live
                .serializeKeysWith(org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(org.springframework.data.redis.serializer.RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues(); // Aligné avec spring.cache.redis.cache-null-values=false

        RedisCacheManagerBuilderCustomizer customizer = builder -> {
            builder.withCacheConfiguration("ecrituresAll", 
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(10)));
            builder.withCacheConfiguration("ecrituresNonValidated", 
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(10)));
            builder.withCacheConfiguration("ecrituresSearch", 
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(10)));
            builder.withCacheConfiguration("compteSolde", 
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(5)));
            builder.withCacheConfiguration("compteAll", 
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofHours(1)));
            builder.withCacheConfiguration("compteByNoCompte", 
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(15)));
        };

        RedisCacheManager cacheManager = RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withCacheConfiguration("ecrituresAll", 
                        RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(10)))
                .withCacheConfiguration("ecrituresNonValidated", 
                        RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(10)))
                .withCacheConfiguration("ecrituresSearch", 
                        RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(10)))
                .withCacheConfiguration("compteSolde", 
                        RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(5)))
                .withCacheConfiguration("compteAll", 
                        RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofHours(1)))
                .withCacheConfiguration("compteByNoCompte", 
                        RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(15)))
                .build();

        log.info("CacheManager configured with TTLs: ecrituresAll=10m, ecrituresNonValidated=10m, ecrituresSearch=10m, " +
                "compteSolde=5m, compteAll=1h, compteByNoCompte=15m");
        return cacheManager;
    }
}