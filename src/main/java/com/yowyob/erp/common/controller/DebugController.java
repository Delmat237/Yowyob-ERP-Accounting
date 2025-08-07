// Contrôleur pour les tests et le debugging
package com.yowyob.erp.common.controller;

import com.yowyob.erp.accounting.service.SynchronizationService;
import com.yowyob.erp.common.dto.ApiResponse;
import com.yowyob.erp.config.tenant.TenantContext;
import com.yowyob.erp.config.kafka.KafkaMessageService;
import com.yowyob.erp.config.redis.RedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final KafkaMessageService kafkaMessageService;
    private final RedisService redisService;
    private final SynchronizationService synchronizationService;

    @PostMapping("/kafka/test")
    public ApiResponse<String> testKafka(@RequestBody Map<String, Object> payload) {
        String tenantId = TenantContext.getCurrentTenant();
        kafkaMessageService.sendAccountingEntry(payload, tenantId, "TEST_EVENT");
        return ApiResponse.success("Message Kafka envoyé");
    }

    @PostMapping("/redis/test")
    public ApiResponse<String> testRedis(@RequestBody Map<String, Object> data) {
        String key = "test:" + TenantContext.getCurrentTenant();
        redisService.save(key, data, java.time.Duration.ofMinutes(5));
        return ApiResponse.success("Données sauvegardées en Redis");
    }

    @GetMapping("/redis/test")
    public ApiResponse<Object> getRedisTest() {
        String key = "test:" + TenantContext.getCurrentTenant();
        Object data = redisService.get(key, Object.class);
        return ApiResponse.success(data);
    }

    @PostMapping("/sync/test")
    public ApiResponse<String> testSync() {
        String tenantId = TenantContext.getCurrentTenant();
        synchronizationService.checkAndSync(tenantId);
        return ApiResponse.success("Synchronisation déclenchée");
    }

    @GetMapping("/tenant/info")
    public ApiResponse<Map<String, String>> getTenantInfo() {
        Map<String, String> info = new HashMap<>();
        info.put("tenantId", TenantContext.getCurrentTenant());
        return ApiResponse.success(info);
    }
}
