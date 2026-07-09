# Guide d'implémentation Offline — Yowyob ERP

Document technique pour le mode hors ligne (online-first avec repli offline).

## Fichiers

| Fichier | Description |
|---------|-------------|
| `offline-implementation.tex` | Source LaTeX complète (backend + frontend) |
| `offline-implementation.pdf` | PDF guide frontend + architecture |
| `backend-offline-spec.tex` | Source LaTeX — exigences backend + idempotence (v1.2) |
| `backend-offline-spec.pdf` | PDF spécification backend offline-first (v1.2, juil. 2026) |

## Compiler le PDF

```bash
cd docs/offline-implementation
pdflatex -interaction=nonstopmode backend-offline-spec.tex
pdflatex -interaction=nonstopmode backend-offline-spec.tex
pdflatex -interaction=nonstopmode offline-implementation.tex
pdflatex -interaction=nonstopmode offline-implementation.tex
```

Si des paquets manquent (`texlive-latex-extra`, `texlive-lang-french`) :

```bash
sudo apt install texlive-latex-extra texlive-lang-french
```

## Implémentation frontend

### Phase 1 — Fondations offline
- IndexedDB, outbox, détection réseau, sync engine
- Pilote : écritures analytiques

### Phase 2 — Lecture offline CG (cache listes)
- `lib/offline/fetch-with-cache.ts` — online-first, repli cache
- `lib/offline/list-cache.ts` — stockage listes dans IndexedDB (meta)
- `lib/offline/cache-keys.ts` — clés CG
- `components/offline/offline-cache-banner.tsx` — bandeau discret

Pages intégrées (lecture) :
- Écritures comptables (`entries`)
- Plan comptable (`chart-of-accounts`)
- Journaux (`journals`)
- Exercices (`fiscal-years`)
- Périodes (`periods`)
- Budgets (`budgets`)

### Phase 3 — Écriture offline CG (brouillons / écritures)
- `lib/offline/mutate-with-outbox.ts` — online-first, outbox si hors ligne
- `lib/offline/cg-ecritures-offline.ts` — mutations écritures CG
- `lib/offline/handlers/ecriture-comptable-sync.ts` — sync vers API
- `lib/offline/id-map.ts` — mapping ID client → serveur

Actions supportées hors ligne :
- Créer / modifier une écriture (brouillon)
- Valider, supprimer, désactiver
- Rejeter (validation)

Pages intégrées (écriture) :
- `accounting/entries`
- `accounting/entries/[id]`
- `accounting/validation`

### Phase 4 — PWA (shell applicatif)
- `public/sw.js` — Service Worker (assets statiques + pages visitées)
- `public/manifest.webmanifest` — manifeste PWA
- `components/offline/service-worker-register.tsx` — enregistrement en production
- `app/offline/page.tsx` — page de repli hors ligne
- `lib/offline/dashboard-cache.ts` — snapshot tableau de bord CG

Le Service Worker est actif **en production** (`npm run build && npm start`).
En développement (`npm run dev`), IndexedDB + outbox restent actifs sans SW.
