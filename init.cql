-- Création du keyspace pour yowyob_erp
CREATE KEYSPACE IF NOT EXISTS yowyob_erp WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

-- Création de la table Tenants
CREATE TABLE IF NOT EXISTS yowyob_erp.tenants (
    tenant_id uuid PRIMARY KEY,
    name text,
    legal_name text,
    registration_number text,
    tax_id text,
    address text,
    phone text,
    email text,
    currency text,
    is_active boolean,
    accounting_code text,
    created_at timestamp,
    updated_at timestamp
);

-- Création de la table Plan Comptable
CREATE TABLE IF NOT EXISTS yowyob_erp.plan_comptable (
    tenant_id text,
    no_compte text,
    id uuid,
    libelle text,
    notes text,
    actif boolean,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (tenant_id, no_compte)
);

-- Création de la table Journal Comptable
CREATE TABLE IF NOT EXISTS yowyob_erp.journal_comptable (
    tenant_id text,
    code_journal text,
    id uuid,
    libelle text,
    type_journal text,
    notes text,
    actif boolean,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (tenant_id, code_journal)
);

-- Création de la table Operation Comptable
CREATE TABLE IF NOT EXISTS yowyob_erp.operation_comptable (
    tenant_id text,
    id uuid,
    type_operation text,
    mode_reglement text,
    compte_principal text,
    est_compte_statique boolean,
    sens_principal text,
    journal_comptable_id text,
    type_montant text,
    plafond_client double,
    actif boolean,
    notes text,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (tenant_id, id)
);

-- Création de la table Contrepartie
CREATE TABLE IF NOT EXISTS yowyob_erp.contrepartie (
    tenant_id text,
    operation_comptable_id uuid,
    id uuid,
    compte text,
    est_compte_tiers boolean,
    sens text,
    type_montant text,
    journal_comptable_id text,
    notes text,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (tenant_id, operation_comptable_id, id)
);

-- Création de la table Declaration Fiscale
CREATE TABLE IF NOT EXISTS yowyob_erp.declaration_fiscale (
    tenant_id text,
    id uuid,
    type_declaration text,
    periode_debut date,
    periode_fin date,
    montant_total double,
    date_generation date,
    statut text,
    numero_declaration text,
    donnees_declaration text,
    notes text,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (tenant_id, id)
);

-- Création de la table Detail Ecriture
CREATE TABLE IF NOT EXISTS yowyob_erp.detail_ecriture (
    tenant_id text,
    ecriture_comptable_id uuid,
    id uuid,
    plan_comptable_id text,
    libelle text,
    sens text,
    montant_debit double,
    montant_credit double,
    notes text,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (tenant_id, ecriture_comptable_id, id)
);

-- Création de la table Ecriture Comptable
CREATE TABLE IF NOT EXISTS yowyob_erp.ecriture_comptable (
    tenant_id text,
    id uuid,
    numero_ecriture text,
    libelle text,
    date_ecriture date,
    journal_comptable_id text,
    periode_comptable_id text,
    montant_total double,
    validee boolean,
    date_validation timestamp,
    utilisateur_validation text,
    reference_externe text,
    notes text,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (tenant_id, id)
);

-- Création de la table Journal Audit
CREATE TABLE IF NOT EXISTS yowyob_erp.journal_audit (
    tenant_id text,
    id uuid,
    ecriture_comptable_id text,
    action text,
    date_action timestamp,
    utilisateur text,
    details text,
    adresse_ip text,
    donnees_avant text,
    donnees_apres text,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (tenant_id, id)
);

-- Création de la table Periode Comptable
CREATE TABLE IF NOT EXISTS yowyob_erp.periode_comptable (
    tenant_id text,
    id uuid,
    code text,
    date_debut date,
    date_fin date,
    cloturee boolean,
    date_cloture date,
    notes text,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (tenant_id, id)
);

-- Création de la table Transaction
CREATE TABLE IF NOT EXISTS yowyob_erp.transaction (
    tenant_id text,
    id uuid,
    numero_recu text,
    operation_comptable_id text,
    montant_transaction double,
    montant_lettre text,
    est_montant_ttc boolean,
    date_transaction timestamp,
    est_validee boolean,
    date_validation timestamp,
    reference_objet text,
    caissier text,
    est_comptabilisee boolean,
    ecriture_comptable_id text,
    notes text,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (tenant_id, id)
);

-- Insertion des données de base OHADA pour plan_comptable
INSERT INTO yowyob_erp.plan_comptable (tenant_id, no_compte, id, libelle, notes, actif, created_at, updated_at) VALUES
('default', '57000', uuid(), 'Caisse Centrale', 'Compte de caisse principal', true, toTimestamp(now()), toTimestamp(now())),
('default', '41100', uuid(), 'Clients', 'Comptes clients', true, toTimestamp(now()), toTimestamp(now())),
('default', '40100', uuid(), 'Fournisseurs', 'Comptes fournisseurs', true, toTimestamp(now()), toTimestamp(now())),
('default', '70100', uuid(), 'Ventes de marchandises', 'Compte de ventes', true, toTimestamp(now()), toTimestamp(now())),
('default', '60300', uuid(), 'Achats de marchandises', 'Compte d''achats', true, toTimestamp(now()), toTimestamp(now())),
('default', '31000', uuid(), 'Stock de marchandises', 'Stock', true, toTimestamp(now()), toTimestamp(now())),
('default', '44300', uuid(), 'TVA collectée', 'TVA sur les ventes', true, toTimestamp(now()), toTimestamp(now())),
('default', '44500', uuid(), 'TVA déductible', 'TVA sur les achats', true, toTimestamp(now()), toTimestamp(now()));

-- Insertion des données de base pour journal_comptable
INSERT INTO yowyob_erp.journal_comptable (tenant_id, code_journal, id, libelle, type_journal, notes, actif, created_at, updated_at) VALUES
('default', 'VTE', uuid(), 'Journal des Ventes', 'SALES', null, true, toTimestamp(now()), toTimestamp(now())),
('default', 'ACH', uuid(), 'Journal des Achats', 'PURCHASES', null, true, toTimestamp(now()), toTimestamp(now())),
('default', 'CAI', uuid(), 'Journal de Caisse', 'CASH', null, toTimestamp(now()), toTimestamp(now())),
('default', 'BAN', uuid(), 'Journal de Banque', 'BANK', null, true, toTimestamp(now()), toTimestamp(now())),
('default', 'OD', uuid(), 'Opérations Diverses', 'GENERAL', null, true, toTimestamp(now()), toTimestamp(now()));
