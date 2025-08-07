-- Création du keyspace pour yowyob_erp
CREATE KEYSPACE IF NOT EXISTS yowyob_erp WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

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
    created_by text,
    updated_by text,
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
    created_by text,
    updated_by text,
    PRIMARY KEY (tenant_id, code_journal)
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
('default', 'CAI', uuid(), 'Journal de Caisse', 'CASH', null, true, toTimestamp(now()), toTimestamp(now())),
('default', 'BAN', uuid(), 'Journal de Banque', 'BANK', null, true, toTimestamp(now()), toTimestamp(now())),
('default', 'OD', uuid(), 'Opérations Diverses', 'GENERAL', null, true, toTimestamp(now()), toTimestamp(now()));
