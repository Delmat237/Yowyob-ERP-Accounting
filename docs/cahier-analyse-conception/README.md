# Cahier d'Analyse et de Conception

## Contenu

- `cahier.tex` : document LaTeX d'analyse et de conception (vocabulaire métier)
- `diagrammes/*.drawio.xml` : diagrammes éditables dans diagrams.net
- `diagrammes/*.puml` : diagrammes de séquence PlantUML

## Compilation

```bash
cd docs/cahier-analyse-conception
pdflatex cahier.tex
pdflatex cahier.tex
```

Paquets utiles si absents : `texlive-lang-french`, `texlive-latex-extra`, `texlive-pictures`.

## Ouverture des diagrammes

1. Ouvrir https://app.diagrams.net/
2. Fichier → Ouvrir depuis → Appareil
3. Sélectionner un fichier `*.drawio.xml`

Ne pas coller le XML en texte brut dans l'éditeur.

## Inventaire

1. Architecture en couches  
2. Cartographie des modules  
3. Séquence de connexion  
4. Cycle d'écriture générale  
5. Flux d'écriture analytique  
6. Modèle conceptuel  
7. Parcours utilisateur global  
8. Composants logiques  
9. Déploiement logique  
10. Activités de validation analytique  
11. Automate d'états d'écriture analytique  
12. Séquence d'import vers l'analytique  
