import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickRemoteLegalContent } from "../legal-content.ts";

describe("pickRemoteLegalContent", () => {
    it("extrait le contenu texte présent", () => {
        const body = { data: { content: "Partie A - Francais\n1. Objet" } };
        assert.equal(pickRemoteLegalContent(body), "Partie A - Francais\n1. Objet");
    });

    it("retourne null quand le contenu est vide ou blanc", () => {
        assert.equal(pickRemoteLegalContent({ data: { content: "" } }), null);
        assert.equal(pickRemoteLegalContent({ data: { content: "   " } }), null);
    });

    it("retourne null quand data/content manque", () => {
        assert.equal(pickRemoteLegalContent({}), null);
        assert.equal(pickRemoteLegalContent({ data: null }), null);
        assert.equal(pickRemoteLegalContent({ data: {} }), null);
    });

    it("retourne null quand le contenu n'est pas une chaîne", () => {
        assert.equal(pickRemoteLegalContent({ data: { content: 42 } }), null);
        assert.equal(pickRemoteLegalContent({ data: { content: { x: 1 } } }), null);
    });

    it("tolère un corps null/undefined", () => {
        assert.equal(pickRemoteLegalContent(null), null);
        assert.equal(pickRemoteLegalContent(undefined), null);
    });
});
