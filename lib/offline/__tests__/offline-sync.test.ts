import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasUpdatedAtConflict, isSyncConflictMessage } from "../conflict.ts";
import { isOfflineClientId } from "../ids.ts";

describe("isOfflineClientId", () => {
    it("accepte les ids locaux non-UUID", () => {
        assert.equal(isOfflineClientId("ea-123"), true);
        assert.equal(isOfflineClientId("ec-offline-1"), true);
        assert.equal(isOfflineClientId("local-abc"), true);
        assert.equal(isOfflineClientId("ch-99"), true);
        assert.equal(isOfflineClientId("c1730000000"), true);
    });

    it("refuse les UUID serveur", () => {
        assert.equal(isOfflineClientId("492c2654-2a5d-41fa-9feb-e47aed1dec24"), false);
        assert.equal(isOfflineClientId(""), false);
        assert.equal(isOfflineClientId(null), false);
    });
});

describe("isSyncConflictMessage", () => {
    it("détecte CONFLICT / 409 / conflit", () => {
        assert.equal(isSyncConflictMessage("CONFLICT: version mismatch"), true);
        assert.equal(isSyncConflictMessage("HTTP 409 Conflict"), true);
        assert.equal(isSyncConflictMessage("conflit offline détecté"), true);
        assert.equal(isSyncConflictMessage("Erreur de connexion"), false);
    });
});

describe("hasUpdatedAtConflict", () => {
    it("détecte une version serveur plus récente", () => {
        assert.equal(
            hasUpdatedAtConflict("2026-07-10T12:00:00Z", "2026-07-10T11:00:00Z"),
            true,
        );
        assert.equal(
            hasUpdatedAtConflict("2026-07-10T11:00:00Z", "2026-07-10T12:00:00Z"),
            false,
        );
        assert.equal(hasUpdatedAtConflict(null, "2026-07-10T12:00:00Z"), false);
        assert.equal(hasUpdatedAtConflict("2026-07-10T12:00:00Z", null), false);
    });
});

describe("ENTITY_TO_CACHE CA keys", () => {
    it("inclut les clés CA dans le mapping pull (smoke via imports)", async () => {
        const { CA_CACHE_KEYS } = await import("../cache-keys.ts");
        assert.equal(CA_CACHE_KEYS.CENTRES, "ca.centres");
        assert.equal(CA_CACHE_KEYS.CHARGES, "ca.charges");
        assert.equal(CA_CACHE_KEYS.COMPTES, "ca.comptes");
        assert.equal(CA_CACHE_KEYS.JOURNAUX, "ca.journaux");
    });
});
