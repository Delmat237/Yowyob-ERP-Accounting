// Listener Kafka pour traiter les événements
package com.yowyob.erp.accounting.listener;

import com.yowyob.erp.common.dto.KafkaMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AccountingKafkaListener {

    /**
     * Écoute les événements de facturation pour génération automatique d'écritures
     */
    @KafkaListener(topics = "invoice.events", groupId = "${spring.kafka.consumer.group-id}")
    public void handleInvoiceEvents(@Payload KafkaMessage message,
                                   @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                                   @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition,
                                   Acknowledgment acknowledgment) {
        try {
            log.info("Réception d'un événement de facture: {} pour le tenant: {}", 
                    message.getEventType(), message.getTenantId());

            // Traitement selon le type d'événement
            switch (message.getEventType()) {
                case "INVOICE_CREATED":
                    handleInvoiceCreated(message);
                    break;
                case "INVOICE_PAID":
                    handleInvoicePaid(message);
                    break;
                default:
                    log.warn("Type d'événement non traité: {}", message.getEventType());
            }

            acknowledgment.acknowledge();
            log.debug("Événement traité avec succès pour la partition: {}", partition);

        } catch (Exception e) {
            log.error("Erreur lors du traitement de l'événement facture", e);
            // Ne pas acknowledgment pour retraitement
        }
    }

    /**
     * Écoute les événements comptables pour mise à jour des caches
     */
    @KafkaListener(topics = "accounting.entries", groupId = "${spring.kafka.consumer.group-id}")
    public void handleAccountingEvents(@Payload KafkaMessage message,
                                     Acknowledgment acknowledgment) {
        try {
            log.info("Réception d'un événement comptable: {} pour le tenant: {}", 
                    message.getEventType(), message.getTenantId());

            // Traitement selon le type d'événement
            switch (message.getEventType()) {
                case "ACCOUNTING_ENTRY_CREATED":
                    handleAccountingEntryCreated(message);
                    break;
                case "ACCOUNTING_ENTRY_VALIDATED":
                    handleAccountingEntryValidated(message);
                    break;
                default:
                    log.warn("Type d'événement comptable non traité: {}", message.getEventType());
            }

            acknowledgment.acknowledge();

        } catch (Exception e) {
            log.error("Erreur lors du traitement de l'événement comptable", e);
        }
    }

    private void handleInvoiceCreated(KafkaMessage message) {
        // TODO: Générer automatiquement l'écriture comptable
        log.info("Traitement de la création de facture: {}", message.getPayload());
    }

    private void handleInvoicePaid(KafkaMessage message) {
        // TODO: Générer l'écriture de règlement
        log.info("Traitement du paiement de facture: {}", message.getPayload());
    }

    private void handleAccountingEntryCreated(KafkaMessage message) {
        // TODO: Mettre à jour les index Elasticsearch
        log.info("Indexation de l'écriture comptable créée");
    }

    private void handleAccountingEntryValidated(KafkaMessage message) {
        // TODO: Mettre à jour les soldes en cache
        log.info("Mise à jour des soldes suite à validation");
    }
}
