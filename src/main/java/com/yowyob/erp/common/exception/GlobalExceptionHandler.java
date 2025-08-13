// Gestionnaire global d'exceptions
package com.yowyob.erp.common.exception;

import com.yowyob.erp.common.dto.ApiResponseWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponseWrapper<Object>> handleBusinessException(BusinessException ex) {
        log.error("Erreur métier: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponseWrapper.error(ex.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponseWrapper<Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.error("Ressource non trouvée: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponseWrapper.error(ex.getMessage()));
    }

    @ExceptionHandler(TenantException.class)
    public ResponseEntity<ApiResponseWrapper<Object>> handleTenantException(TenantException ex) {
        log.error("Erreur de tenant: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponseWrapper.error(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponseWrapper<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        log.error("Erreurs de validation: {}", errors);
        return ResponseEntity.badRequest()
                 .body(ApiResponseWrapper.error(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponseWrapper<Object>> handleGenericException(Exception ex) {
        log.error("Erreur interne du serveur", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponseWrapper.error("Erreur interne du serveur"));
    }
}
