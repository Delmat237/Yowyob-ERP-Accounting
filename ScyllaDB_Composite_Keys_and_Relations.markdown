# Utilité des Clés Composites et Gestion des Relations dans ScyllaDB

## Utilité des Clés Composites dans ScyllaDB

Les **clés composites** (ou clés primaires composées) dans ScyllaDB sont essentielles pour structurer les données dans une base de données NoSQL distribuée, optimisée pour des performances élevées et une scalabilité horizontale. Une clé composite est composée d’une **clé de partition** et d’une ou plusieurs **clés de clustering**, qui définissent comment les données sont organisées, stockées et interrogées. Voici une explication détaillée de leur utilité :

1. **Partitionnement des Données (Clé de Partition)** :
   - La clé de partition détermine sur quel nœud du cluster ScyllaDB les données seront stockées, permettant une répartition équilibrée pour une scalabilité optimale.
   - **Exemple** : Dans la table `plan_comptable`, `tenant_id` est la clé de partition, garantissant que toutes les données d’un tenant sont stockées sur le même nœud, facilitant l’isolation multi-tenant.

2. **Organisation des Données dans une Partition (Clés de Clustering)** :
   - Les clés de clustering trient les lignes au sein d’une partition, optimisant les lectures séquentielles.
   - **Exemple** : Dans `plan_comptable`, `id` (UUID) est la clé de clustering, assurant l’unicité des comptes dans une partition `tenant_id` et un accès rapide par ID.

3. **Support des Requêtes Performantes** :
   - Les clés composites permettent des requêtes efficaces en incluant la clé de partition et les clés de clustering dans l’ordre défini, évitant des scans coûteux.
   - **Exemple** : Dans `ecriture_comptable`, la clé `(tenant_id, id)` permet des requêtes rapides comme `SELECT * FROM ecriture_comptable WHERE tenant_id = ? AND id = ?`.

4. **Isolation Multi-Tenant** :
   - Inclure `tenant_id` dans la clé composite garantit une isolation physique et logique des données par tenant, essentielle pour le module ERP Yowyob.

5. **Flexibilité pour les Vues Matérialisées** :
   - Les clés composites permettent de créer des vues matérialisées avec des clés différentes pour optimiser les requêtes spécifiques.
   - **Exemple** : La vue `operations_comptable_by_type_and_mode` utilise `(tenant_id, type_operation, mode_reglement, id)` pour des recherches par type et mode.

6. **Gestion des Données à Grande Échelle** :
   - Les clés composites assurent une distribution efficace des données et un accès rapide, même avec de grands volumes.

## Gestion des Relations entre les Tables dans ScyllaDB

Contrairement aux bases de données relationnelles, ScyllaDB ne prend pas en charge les clés étrangères ou les jointures SQL. Les relations sont gérées par **dénormalisation** et **modélisation orientée requêtes**. Voici comment cela est appliqué dans le module comptable ERP Yowyob :

1. **Dénormalisation des Données** :
   - Les relations sont gérées en dupliquant les données nécessaires dans les tables ou via des jointures côté application.
   - **Exemple** : Dans `operation_comptable`, `compte_principal` stocke le `no_compte` de `plan_comptable`. L’application valide l’existence du compte via `PlanComptableService`.

2. **Validation des Références dans l’Application** :
   - Les relations sont validées par la logique métier dans les services Spring Boot.
   - **Exemple** : Avant d’insérer une écriture dans `ecriture_comptable`, `EcritureComptableService` vérifie l’existence de `journal_comptable_id` et `periode_comptable_id` :
     ```java
     public EcritureComptableDto createEcriture(EcritureComptableDto dto) {
         UUID tenantId = TenantContext.getCurrentTenant();
         if (!journalComptableRepository.existsByKeyTenantIdAndId(tenantId, dto.getJournalComptableId())) {
             throw new BusinessException("Journal comptable non trouvé");
         }
         if (!periodeComptableRepository.existsByKeyTenantIdAndId(tenantId, dto.getPeriodeComptableId())) {
             throw new BusinessException("Période comptable non trouvée");
         }
         // Logique de création
     }
     ```

3. **Utilisation des Vues Matérialisées** :
   - Les vues matérialisées optimisent les requêtes spécifiques sans jointures.
   - **Exemple** : La vue `periode_comptable_by_date` permet des recherches par `date_debut` et `date_fin`.

4. **Références via Identifiants** :
   - Les relations sont maintenues en stockant des identifiants (UUID) dans les tables, comme `journal_comptable_id` dans `ecriture_comptable`.
   - **Exemple** : Récupérer un journal :
     ```sql
     SELECT * FROM journal_comptable WHERE tenant_id = ? AND id = ?;
     ```

5. **Audit et Traçabilité avec `journal_audit`** :
   - La table `journal_audit` enregistre toutes les actions, liant les entités via `entity_id`.
   - **Exemple** :
     ```sql
     INSERT INTO journal_audit (tenant_id, id, action, entity_type, entity_id, utilisateur, date_action, details)
     VALUES (?, uuid(), 'CREATE', 'PLAN_COMPTABLE', ?, ?, toTimestamp(now()), ?);
     ```

6. **Kafka pour la Cohérence des Données** :
   - Les événements Kafka (par exemple, `plan.comptable.created`) maintiennent la cohérence.
   - **Exemple** : Vérification d’un compte actif dans `OperationComptableService` :
     ```java
     public void createOperation(OperationComptableDto dto) {
         PlanComptable account = planComptableRepository.findByKeyTenantIdAndNoCompte(tenantId, dto.getComptePrincipal())
             .orElseThrow(() -> new BusinessException("Compte non trouvé"));
         if (!account.getActif()) {
             throw new BusinessException("Compte désactivé");
         }
         // Logique de création
     }
     ```

7. **Modélisation Orientée Requêtes** :
   - Les tables sont conçues pour répondre directement aux endpoints des contrôleurs.
   - **Exemple** : L’endpoint `/api/accounting/plan-comptable/prefix/{prefix}` utilise `findByKeyTenantIdAndNoComptePrefix`.

8. **Absence de Jointures** :
   - Les données liées sont récupérées via des requêtes multiples côté application.
   - **Exemple** :
     ```java
     PlanComptableDto account = planComptableService.getAccountByNoCompte(operation.getComptePrincipal());
     OperationComptableResponse response = new OperationComptableResponse(operation, account.getLibelle());
     ```

## Exemple Pratique : Relations dans le Module Comptable

Pour une écriture comptable (`ecriture_comptable`) liée à `plan_comptable`, `operation_comptable`, `periode_comptable`, et `journal_comptable` :

1. **Création d’une Écriture** :
   - Vérifications :
     - `compte_principal` existe dans `plan_comptable` et est actif.
     - `journal_comptable_id` existe dans `journal_comptable`.
     - `periode_comptable_id` existe et n’est pas clôturé.
   - **Code** :
     ```java
     public EcritureComptableDto createEcriture(EcritureComptableDto dto) {
         UUID tenantId = TenantContext.getCurrentTenant();
         if (!journalComptableRepository.existsByKeyTenantIdAndId(tenantId, dto.getJournalComptableId())) {
             throw new BusinessException("Journal comptable non trouvé");
         }
         PeriodeComptable periode = periodeComptableRepository.findByKeyTenantIdAndId(tenantId, dto.getPeriodeComptableId())
             .orElseThrow(() -> new BusinessException("Période comptable non trouvée"));
         if (periode.getCloturee()) {
             throw new BusinessException("Période comptable clôturée");
         }
         EcritureComptable entity = new EcritureComptable();
         entity.setKey(new EcritureComptableKey(tenantId, UUID.randomUUID()));
         // ... autres champs
         ecritureComptableRepository.save(entity);
         kafkaTemplate.send("ecriture.comptable.created", tenantId.toString(), dto);
         return mapToDto(entity);
     }
     ```

2. **Requête avec Détails** :
   - Récupérer une écriture avec le nom du journal et de la période :
     ```java
     public EcritureComptableDetailsDto getEcritureDetails(UUID id) {
         UUID tenantId = TenantContext.getCurrentTenant();
         EcritureComptable ecriture = ecritureComptableRepository.findByKey(new EcritureComptableKey(tenantId, id))
             .orElseThrow(() -> new ResourceNotFoundException("Ecriture", id.toString()));
         JournalComptable journal = journalComptableRepository.findByKey(new JournalComptableKey(tenantId, ecriture.getJournalComptableId()))
             .orElseThrow(() -> new ResourceNotFoundException("Journal", ecriture.getJournalComptableId().toString()));
         PeriodeComptable periode = periodeComptableRepository.findByKey(new PeriodeComptableKey(tenantId, ecriture.getPeriodeComptableId()))
             .orElseThrow(() -> new ResourceNotFoundException("Periode", ecriture.getPeriodeComptableId().toString()));
         return new EcritureComptableDetailsDto(ecriture, journal.getLibelle(), periode.getCode());
     }
     ```

3. **Audit** :
   - Enregistrement d’une action :
     ```sql
     INSERT INTO journal_audit (tenant_id, id, action, entity_type, entity_id, utilisateur, date_action, details)
     VALUES (uuid(), uuid(), 'CREATE', 'PLAN_COMPTABLE', uuid(), 'admin', toTimestamp(now()), 'Compte 101000 créé');
     ```

## Avantages et Limites

### Avantages
- **Performance** : Accès rapide sans jointures, idéal pour un ERP à haute charge.
- **Scalabilité** : Partitionnement par `tenant_id` pour une distribution efficace.
- **Flexibilité** : Vues matérialisées pour divers besoins de requêtes.

### Limites
- **Complexité de Modélisation** : Nécessite une planification minutieuse pour éviter des requêtes inefficaces.
- **Dénormalisation** : Augmente la taille des données et exige une gestion rigoureuse de la cohérence.
- **Maintenance** : Les mises à jour des relations doivent être validées côté application.

## Application au Module Comptable ERP Yowyob

- **Clés Composites** :
  - `plan_comptable` : `(tenant_id, id)` pour l’isolation et l’accès par UUID.
  - `ecriture_comptable` : `(tenant_id, id)` pour les écritures.
  - `operation_comptable` : `(tenant_id, id)` avec vue pour type/mode.
  - `periode_comptable` : `(tenant_id, id)` avec vue pour dates.
  - `journal_audit` : `(tenant_id, date_action, id)` pour audits triés.

- **Relations** :
  - **Plan Comptable → Opération** : `compte_principal` référence `no_compte`.
  - **Écriture → Journal/Periode** : Références via `journal_comptable_id` et `periode_comptable_id`.
  - **Audit** : Actions tracées dans `journal_audit` avec `entity_id`.

- **Exemple de Requête** :
  ```sql
  SELECT * FROM operations_comptable_by_type_and_mode WHERE tenant_id = ? AND type_operation = 'ACHAT';
  ```

## Conclusion

Les clés composites dans ScyllaDB garantissent des performances et une scalabilité optimales pour le module comptable ERP Yowyob. Les relations sont gérées par dénormalisation, validation dans l’application, et vues matérialisées, avec Kafka pour la cohérence. Cela assure une gestion robuste des comptes, écritures, opérations, et périodes, tout en respectant les normes OHADA.