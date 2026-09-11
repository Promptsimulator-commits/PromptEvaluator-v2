---
title: Sprint Change Proposal — Pivot mécanique V2
date: 2026-09-11
status: approved
---

# Sprint Change Proposal — Pivot mécanique V2

## 1. Issue Summary

Le 2026-09-11, la PM (Laurent) a validé, avec Sally (UX designer), une refonte complète de la mécanique du produit — voir `_bmad-output/implementation-artifacts/session-log-2026-09-11-v2-design.md` pour le raisonnement complet. Déclencheur : les utilisateurs de la V1 ne comprenaient pas la différence entre les deux boutons "Évaluer" et "Analyser" ; la PM a proposé une refonte plutôt qu'un ajustement de copy.

Décisions de fond retenues (fond mécanique, non renégocié dans cette session) :
- Plus de critères d'acceptance saisis à la main — une IA les extrait automatiquement du texte du prompt, affichés dans une liste éditable pour validation.
- 3 critères de base, fixes, jamais affichés à l'écran, toujours appliqués en plus des critères extraits.
- Passage de 4 à 3 dimensions de notation (Objectif, Contexte, Contraintes — "Exemples" intégré dans Contraintes comme 3ᵉ axe, "Persona" fusionné dans Contexte).
- Notation en 2 temps par dimension : signal textuel (lecture du prompt) puis correction comportementale (divergence entre les N réponses générées), sur 3 niveaux (faible/modérée/forte).
- Fusion des deux actions "Évaluer"/"Analyser" en un seul flux "Envoyer" — plus de bouton "Analyser" séparé.

Cette session a constaté que **seuls le journal de session et les spines UX reflétaient ces décisions** : le PRD, les epics et l'architecture du dépôt V2 portaient le suffixe `-v2` mais leur contenu était identique à la mécanique V1 retirée. Le code applicatif (`app/`) est également celui de la mécanique V1, hérité tel quel du dépôt V1.

## 2. Impact Analysis

**Epic Impact** — Les deux epics existants sont obsolètes tels qu'écrits :
- Ancien Épic 1 ("Évaluer" — critères manuels, N exécutions, score par exécution) et ancien Épic 2 ("Analyser" — 4 dimensions) fusionnent en une mécanique à deux epics réorganisés autour du flux réel : Epic 1 (envoi : extraction + génération) et Epic 2 (notation par dimension + correction).
- `sprint-status.yaml` indiquait epic-1 `done` et les 2 stories d'epic-2 `done` — ce travail couvrait la mécanique retirée. Remis à `backlog` (sauf Story 1.1, infrastructure, toujours valide).

**Artifact Conflicts** —
- **PRD** (`prd-v2.md`) : FR2, FR5, FR6, FR8 retirés ; FR2a, FR2b nouveaux ; FR4, FR7, FR9, FR10 reformulés ; User Journey UJ-1 réécrite. Incohérence pré-existante corrigée au passage (Non-Goal "N fixé à 5" contredisait FR3b).
- **Epics** (`epics-v2.md`) : réécriture complète — 2 epics, 9 stories (1 inchangée, 4 adaptées en profondeur, 4 nouvelles), critères d'acceptation Gherkin détaillés.
- **Architecture** (`ARCHITECTURE-SPINE-v2.md`) : nouvelle route `/api/extract-criteria`, route `/api/analyze` renommée `/api/analyze-dimensions` avec un contrat de sortie entièrement différent, nouvel AD-2b (critères fixes injectés côté serveur) et AD-4b (seuils de correction comportementale), AD-4 étendu à 4 phases d'orchestration.
- **UX** (`DESIGN.md`/`EXPERIENCE.md`) : déjà mis à jour dans cette même session (voir mode Update de `bmad-ux`, avec Sally) — grille 3 colonnes, boutons renommés, bascule Réponses/Analyse, 2 mocks HTML ajoutés.
- **Démo** (`demo-dossier-v2.html`) : contenu réécrit (mécanique, exemple, parcours, diagramme d'architecture, cadrage du POC) — style visuel inchangé.
- **Documentation racine** : bannières `CLAUDE.md`/`README.md` corrigées (mentionnaient encore "4 dimensions").
- **Autres artefacts** : `addendum.md` (historique Prompt Trainer) laissé tel quel — document de lignée, pas une spec vivante. `CONTRIBUTING-v2.md`/`TESTING-v2.md` vérifiés, aucune référence à la mécanique retirée trouvée.

**Technical Impact** — Le code applicatif (`app/api/execute`, `app/api/score`, `app/api/analyze`, `app/page.js`) reste celui de la mécanique V1 et devra être réécrit lors du prochain chantier de build, en suivant les nouvelles stories d'`epics-v2.md`. Aucun code n'a été modifié dans cette session (documentation uniquement, sur demande explicite de la PM : "avant de commencer à développer").

## 3. Recommended Approach

**Direct Adjustment** (Option 1 du checklist) : réécriture des documents pour refléter la mécanique déjà décidée, sans rollback (rien à revenir en arrière — le code existant sera remplacé au moment du build, ce qui est attendu) ni révision du MVP (mêmes objectifs, même public, mêmes critères de succès de démo — seule la mécanique change).

Effort : Medium (rédaction documentaire — la mécanique elle-même était déjà entièrement tranchée avant cette session). Risque : Low (pas de code touché, décisions déjà validées par la PM lors de la conception UX).

## 4. Detailed Change Proposals

Voir directement les fichiers modifiés — chaque changement a été présenté et approuvé individuellement avec la PM avant application (mode incrémental) :
- [`prd-v2.md`](prds/prd-prompt-evaluator-2026-09-04/prd-v2.md)
- [`epics-v2.md`](epics-v2.md)
- [`ARCHITECTURE-SPINE-v2.md`](architecture/architecture-prompt-evaluator-2026-09-04/ARCHITECTURE-SPINE-v2.md)
- [`demo-dossier-v2.html`](prds/prd-prompt-evaluator-2026-09-04/demo-dossier-v2.html)
- [`DESIGN.md`](ux-designs/ux-prompt-evaluator-2026-09-08/DESIGN.md) / [`EXPERIENCE.md`](ux-designs/ux-prompt-evaluator-2026-09-08/EXPERIENCE.md) (mis à jour avant ce chantier, via `bmad-ux`)
- `CLAUDE.md`, `README.md` (racine du dépôt)
- [`sprint-status.yaml`](../implementation-artifacts/sprint-status.yaml) (remis à `backlog`)

## 5. Implementation Handoff

**Scope classification : Major** — remplace fondamentalement le contrat technique (nouvelle route API, contrats de sortie changés) et restructure les epics, même si la mécanique métier était déjà entièrement décidée en amont.

**Routage** : Product Manager (Laurent) / rôle Architecte — déjà exécuté dans cette session (pas de handoff externe nécessaire, contexte vibecoding PM + Claude Code). Prochaine étape naturelle : `bmad-build` ou `bmad-sprint-planning` pour démarrer l'implémentation des nouvelles stories d'Epic 1, en commençant par la Story 1.2 (Story 1.1 déjà faite).

**Success criteria** : le code applicatif (`app/`) est réécrit pour suivre `ARCHITECTURE-SPINE-v2.md` et `epics-v2.md` ; les scénarios Gherkin de chaque story sont vérifiés manuellement dans le navigateur avant chaque PR (voir `TESTING-v2.md`) ; le dossier de démo (`demo-dossier-v2.html`) reste synchronisé avec le comportement réel de l'app au moment de la démo.
