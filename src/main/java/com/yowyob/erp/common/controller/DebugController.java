// Contrôleur pour les tests et le debugging
package com.yowyob.erp.common.controller;

import com.yowyob.erp.accounting.service.SynchronizationService;
import com.yowyob.erp.common.dto.ApiResponseWrapper;
import com.yowyob.erp.config.tenant.TenantContext;
import com.yowyob.erp.config.kafka.KafkaMessageService;
import com.yowyob.erp.config.redis.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final KafkaMessageService kafkaMessageService;
    private final RedisService redisService;
    private final SynchronizationService synchronizationService;

    @PostMapping("/kafka/test")
    public ApiResponseWrapper<String> testKafka(@RequestBody Map<String, Object> payload) {
        String tenantId = TenantContext.getCurrentTenant().toString();
        kafkaMessageService.sendAccountingEntry(payload, tenantId, "TEST_EVENT");
        return ApiResponseWrapper.success("Message Kafka envoyé");
    }

    @PostMapping("/redis/test")
    public ApiResponseWrapper<String> testRedis(@RequestBody Map<String, Object> data) {
        String key = "test:" + TenantContext.getCurrentTenant().toString();
        redisService.save(key, data, java.time.Duration.ofMinutes(5));
        return ApiResponseWrapper.success("Données sauvegardées en Redis");
    }

    @GetMapping("/redis/test")
    public ApiResponseWrapper<Object> getRedisTest() {
        String key = "test:" + TenantContext.getCurrentTenant().toString();
        Object data = redisService.get(key, Object.class);
        return ApiResponseWrapper.success(data);
    }

    @PostMapping("/sync/test")
    public ApiResponseWrapper<String> testSync() {
        UUID tenantId = TenantContext.getCurrentTenant();
        synchronizationService.checkAndSync(tenantId);
        return ApiResponseWrapper.success("Synchronisation déclenchée");
    }

    @GetMapping("/tenant/info")
    public ApiResponseWrapper<Map<String, UUID>> getTenantInfo() {
        Map<String, UUID> info = new HashMap<>();
        info.put("tenantId", TenantContext.getCurrentTenant());
        return ApiResponseWrapper.success(info);
    }
}
