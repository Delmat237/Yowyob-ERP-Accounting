package com.yowyob.erp.config.auth;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Service pour interagir avec l'API d'authentification externe
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final WebClient webClient;

    @Value("${auth.api.url}")
    private String authApiUrl;

    @Value("${auth.api.timeout:5000}")
    private int timeout;

    /**
     * Valide un token JWT via l'API externe
     * Résultat mis en cache pour éviter les appels répétés
     */
    @Cacheable(value = "jwt-validation", key = "#token")
    public Mono<AuthValidationResponse> validateToken(String token) {
        log.debug("Validation du token JWT via API externe");
        
        return webClient
                .post()
                .uri(authApiUrl + "/validate") // Endpoint de validation du token à implementer par ce servi
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(this::parseAuthResponse)
                .timeout(Duration.ofMillis(timeout))
                .doOnError(error -> log.error("Erreur lors de la validation du token", error))
                .onErrorReturn(AuthValidationResponse.invalid());
    }

    private AuthValidationResponse parseAuthResponse(JsonNode response) {
        if (response.has("valid") && response.get("valid").asBoolean()) {
            return AuthValidationResponse.builder()
                    .valid(true)
                    .userId(response.get("userId").asText())
                    .tenantId(response.get("tenantId").asText())
                    .roles(response.get("roles").asText().split(","))
                    .build();
        }
        return AuthValidationResponse.invalid();
    }

    /**
     * Récupère les informations utilisateur
     */
    @Cacheable(value = "user-info", key = "#userEmail")
    public Mono<UserInfo> getUserInfo(String userEmail, String token) {
        return webClient
                .get()
                .uri(authApiUrl + "/users/email/" + userEmail)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .bodyToMono(UserInfo.class)
                .timeout(Duration.ofMillis(timeout))
                .doOnError(error -> log.error("Erreur lors de la récupération des infos utilisateur", error));
    }
}
