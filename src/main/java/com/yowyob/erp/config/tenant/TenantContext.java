package com.yowyob.erp.config.tenant;

import jakarta.validation.constraints.Size;
import org.springframework.stereotype.Component;
import java.util.UUID;
/**
 * Contexte tenant pour isoler les données par tenant
 * Utilise ThreadLocal pour maintenir le tenantId par thread
 */
@Component
public class TenantContext {
    
    private static final ThreadLocal<UUID> currentTenant = new ThreadLocal<>();
    
    public static void setCurrentTenant(UUID tenantId) {
        currentTenant.set(tenantId);
    }
    
    public static UUID getCurrentTenant() {
        return currentTenant.get();
    }
    
    public static void clear() {
        currentTenant.remove();
    }


    public static @Size(max = 255, message = "Mis à jour par ne doit pas dépasser 255 caractères") String getCurrentUser() {
        //Je devrais implementer
        return null;
    }
    public static void setCurrentUser(String user) {
        //Je devrais implementer
        // Pour l'instant, on ne stocke pas l'utilisateur dans le contexte  
        // mais on pourrait le faire si nécessaire
    }
}
