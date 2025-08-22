package com.yowyob.erp.config.kafka;

import com.yowyob.erp.common.dto.KafkaMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaMessageService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.accounting-entries}")
    private String accountingEntriesTopic;

    @Value("${app.kafka.topics.invoice-events}")
    private String invoiceEventsTopic;

    @Value("${app.kafka.topics.notifications}")
    private String notificationsTopic;

    @Value("${app.kafka.topics.audit-logs}")
    private String auditLogsTopic;

    @Value("${app.kafka.topics.tenant-created}")
    private String tenantCreatedTopic;

    @Value("${app.kafka.topics.tenant-updated}")
    private String tenantUpdatedTopic;

    @Value("${app.kafka.topics.tenant-deleted}")
    private String tenantDeletedTopic;

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public void sendAccountingEntry(Object payload, String tenantId, String eventType) {
        KafkaMessage message = KafkaMessage.builder()
                .payload(payload)
                .tenantId(tenantId)
                .eventType(eventType)
                .timestamp(LocalDateTime.now())
                .build();

        sendMessage(accountingEntriesTopic, tenantId, message);
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public void sendInvoiceEvent(Object payload, String tenantId, String eventType) {
        KafkaMessage message = KafkaMessage.builder()
                .payload(payload)
                .tenantId(tenantId)
                .eventType(eventType)
                .timestamp(LocalDateTime.now())
                .build();

        sendMessage(invoiceEventsTopic, tenantId, message);
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public void sendNotification(Object payload, String tenantId, String eventType) {
        KafkaMessage message = KafkaMessage.builder()
                .payload(payload)
                .tenantId(tenantId)
                .eventType(eventType)
                .timestamp(LocalDateTime.now())
                .build();

        sendMessage(notificationsTopic, tenantId, message);
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public void sendAuditLog(Object payload, String tenantId, String action) {
        KafkaMessage message = KafkaMessage.builder()
                .payload(payload)
                .tenantId(tenantId)
                .eventType(action)
                .timestamp(LocalDateTime.now())
                .build();

        sendMessage(auditLogsTopic, tenantId, message);
    }

    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public void sendMessage(String topic, String key, Object message) {
        try {
            CompletableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, key, message);
            future.whenComplete((result, exception) -> {
                if (exception == null) {
                    log.debug("Message envoyé avec succès vers le topic [{}] avec offset=[{}]", topic, result.getRecordMetadata().offset());
                } else {
                    log.error("Échec de l'envoi du message vers le topic [{}] : {}", topic, exception.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du message vers le topic [{}]", topic, e);
            throw e; // Relance pour le retry
        }
    }
}