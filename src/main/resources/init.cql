CREATE KEYSPACE IF NOT EXISTS yowyob_erp
WITH replication = {'class': 'NetworkTopologyStrategy', 'datacenter1': 3};

USE yowyob_erp;

-- Table pour le plan comptable
CREATE TABLE plan_comptable (
    tenant_id UUID,
    id UUID,
    no_compte TEXT,
    classe INT,
    libelle TEXT,
    actif BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    PRIMARY KEY (tenant_id, id)
);

-- Table pour les écritures comptables
CREATE TABLE ecriture_comptable (
    tenant_id UUID,
    id UUID,
    numero_ecriture TEXT,
    libelle TEXT,
    date_ecriture DATE,
    journal_comptable_id UUID,
    periode_comptable_id UUID,
    montant_total DOUBLE,
    validee BOOLEAN,
    date_validation TIMESTAMP,
    utilisateur_validation TEXT,
    reference_externe TEXT,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    PRIMARY KEY (tenant_id, id)
);

-- Table pour les opérations comptables
CREATE TABLE operation_comptable (
    tenant_id UUID,
    id UUID,
    type_operation TEXT,
    mode_reglement TEXT,
    compte_principal TEXT,
    est_compte_statique BOOLEAN,
    sens_principal TEXT,
    journal_comptable_id UUID,
    type_montant TEXT,
    plafond_client DOUBLE,
    actif BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    PRIMARY KEY (tenant_id, id)
);

-- Vue matérialisée pour les opérations comptables par type et mode
CREATE MATERIALIZED VIEW operations_comptable_by_type_and_mode AS
    SELECT tenant_id, id, type_operation, mode_reglement, compte_principal, est_compte_statique, 
           sens_principal, journal_comptable_id, type_montant, plafond_client, actif
    FROM operation_comptable
    WHERE tenant_id IS NOT NULL AND id IS NOT NULL AND type_operation IS NOT NULL AND mode_reglement IS NOT NULL
    PRIMARY KEY (tenant_id, type_operation, mode_reglement, id)
    WITH CLUSTERING ORDER BY (type_operation ASC, mode_reglement ASC, id ASC);

-- Table pour les périodes comptables
CREATE TABLE periode_comptable (
    tenant_id UUID,
    id UUID,
    code TEXT,
    date_debut DATE,
    date_fin DATE,
    cloturee BOOLEAN,
    date_cloture DATE,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    PRIMARY KEY (tenant_id, id)
);

-- Vue matérialisée pour les périodes comptables par date
CREATE MATERIALIZED VIEW periode_comptable_by_date AS
    SELECT tenant_id, id, code, date_debut, date_fin, cloturee, date_cloture
    FROM periode_comptable
    WHERE tenant_id IS NOT NULL AND id IS NOT NULL AND date_debut IS NOT NULL AND date_fin IS NOT NULL
    PRIMARY KEY (tenant_id, date_debut, date_fin, id)
    WITH CLUSTERING ORDER BY (date_debut ASC, date_fin ASC, id ASC);

-- Table pour les journaux comptables
CREATE TABLE journal_comptable (
    tenant_id UUID,
    id UUID,
    code TEXT,
    libelle TEXT,
    type_journal TEXT,
    actif BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by TEXT,
    updated_by TEXT,
    PRIMARY KEY (tenant_id, id)
);

-- Table pour l'audit des actions
CREATE TABLE journal_audit (
    tenant_id UUID,
    id UUID,
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    utilisateur TEXT,
    date_action TIMESTAMP,
    details TEXT,
    PRIMARY KEY (tenant_id, date_action, id)
) WITH CLUSTERING ORDER BY (date_action DESC, id ASC);