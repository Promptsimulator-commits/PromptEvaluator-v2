---
title: 'Calculer et afficher la note par dimension à partir du signal textuel'
type: 'feature'
created: '2026-09-11'
status: 'review'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/spec-4-dimensions-prompt-evaluator-seed.md']
baseline_commit: 'f53ecf13f5a9c8f845242c69a3d51ff6c46305c0'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Depuis l'Épic 1, les N réponses sont générées et notées en arrière-plan, mais rien n'évalue le prompt lui-même — l'utilisateur n'a aucun retour sur sa qualité (Objectif/Contexte/Contraintes).

**Approche:** Nouvelle route `/api/analyze-dimensions` qui lit le prompt seul (signal textuel, pas encore la correction comportementale — Story 2.2) et renvoie une note 0-10 par dimension, calculée en 3 dimensions fixes. Le palier (Absent/À clarifier/Clair/Très clair) est calculé côté code à partir de la note, jamais laissé au jugement du modèle. Déclenchement automatique dès que la notation (Épic 1) est terminée — pas une action séparée. Affichage : 3 cartes identiques (Objectif, Contexte, Contraintes), et une bascule "Voir l'analyse"/"Voir les réponses" pour naviguer entre les deux vues, sans nouvel appel réseau.

**Note de scope inter-story :** les cartes ne sont pas encore dépliables (Story 2.3) — seuls la note et le palier sont visibles. `correctionApplied` est toujours `false` dans cette story (Story 2.2 branchera la vraie logique de correction) ; le paramètre `scoreResults` du contrat de route n'est ni envoyé par le client, ni utilisé par la route dans cette story.

## Boundaries & Constraints

**Always:** exactement 3 dimensions (`objectif`, `contexte`, `contraintes`) ; palier calculé en code à partir de la note (0=Absent, 1-5=À clarifier, 6-8=Clair, 9-10=Très clair), jamais renvoyé tel quel par le modèle ; contexte neuf par appel (AD-3) ; erreurs `{error}`+500 (AD-2) ; appel déclenché automatiquement en phase 4, immédiatement après la phase 3 (notation) réussie — jamais au clic sur la bascule ; un échec de cet appel abandonne tout le flux comme un échec d'Épic 1 (réponses déjà affichées incluses).

**Never:** ne pas implémenter la correction comportementale (Story 2.2) — `correctionApplied` toujours `false` ; ne pas rendre les cartes dépliables (Story 2.3) ; ne pas afficher de note globale/moyenne ni de "point faible" mis en avant (concept abandonné avec le pivot) ; ne pas modifier `/api/execute`, `/api/extract-criteria`, `/api/score`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Notation (Épic 1) terminée avec succès | `scoreResults` complet | `/api/analyze-dimensions` appelé automatiquement avec `{prompt}` | N/A |
| Note reçue = 0 | `note: 0` | palier "Absent" | N/A |
| Note reçue = 5 | `note: 5` | palier "À clarifier" | N/A |
| Note reçue = 7 | `note: 7` | palier "Clair" | N/A |
| Note reçue = 10 | `note: 10` | palier "Très clair" | N/A |
| Analyse échoue | erreur serveur/réseau | tout le flux abandonné (réponses déjà affichées incluses) | panneau `role="alert"` précisant l'échec de l'analyse |
| Clic sur "Voir l'analyse" | résultats prêts | bascule vers les 3 cartes, aucun appel réseau | N/A |
| Clic sur "Voir les réponses" | vue analyse active | retour à la liste des réponses, aucun appel réseau | N/A |

</frozen-after-approval>

## Code Map

- `app/api/analyze-dimensions/route.js` -- nouvelle route, sur le modèle de `/api/score/route.js` (tool-use, schéma strict, `MODEL`/`MAX_TOKENS`/`errorResponse`/`hasApiKey`/`describeAnthropicError` de `lib/anthropic.js`) ; contrat : `{ prompt }` → `{ dimensions: [{name, note, palier, explanation, rewriteSuggestion, correctionApplied}] }` (voir `ARCHITECTURE-SPINE-v2.md` AD-2 pour la forme exacte)
- `_bmad-output/planning-artifacts/spec-4-dimensions-prompt-evaluator-seed.md` -- ancrages par dimension (0-2/3-5/6-8/9-10 dans le seed, à adapter au barème actuel 0/1-5/6-8/9-10) : Objectif et Contexte inchangés par le pivot ; Contraintes révisé — 3 axes possibles (format/longueur, exclusions, exemple concret), voir `epic-2-context.md` pour la version à jour
- `app/page.js` -- après le succès de la boucle de notation (Story 1.5, fin de `handleConfirm`), appeler `/api/analyze-dimensions` avec `{prompt}` ; nouvel état `dimensions`, `analysisError`, `activeView` ('reponses' | 'analyse', défaut 'reponses') ; bouton de bascule ; rendu des 3 cartes (note + palier, non dépliables) en `sm:grid-cols-3`
- `app/api/score/route.js`, `app/api/execute/route.js`, `app/api/extract-criteria/route.js` -- ne pas modifier

## Tasks & Acceptance

**Execution:**
- [x] `app/api/analyze-dimensions/route.js` -- appel Anthropic (tool-use, schéma forçant `note` entier 0-10 + `explanation` + `rewriteSuggestion` par dimension, 3 dimensions exactement) ; palier calculé en JS à partir de `note` ; `correctionApplied: false` en dur -- FR9
- [x] `app/page.js` -- déclenchement automatique de l'appel en phase 4 (après succès de la phase 3) ; abandon complet si échec (même motif que Story 1.4/1.5) -- FR9
- [x] `app/page.js` -- bascule "Voir l'analyse"/"Voir les réponses" (état `activeView`, sans appel réseau) + rendu des 3 cartes identiques (note, palier en pastille avec libellé texte) -- FR9

**Acceptance Criteria:**
- Given les N réponses ont été générées et notées, when la notation se termine avec succès, then `/api/analyze-dimensions` est appelé automatiquement avec le prompt (contexte neuf), sans action de l'utilisateur
- Given l'analyse a réussi, when je clique sur "Voir l'analyse", then 3 cartes (Objectif, Contexte, Contraintes) s'affichent côte à côte, chacune avec sa note et son palier, visuellement identiques
- Given l'analyse échoue, when l'erreur survient, then tout le flux est abandonné (réponses déjà affichées incluses) et un message précise l'échec de l'analyse
- Given les résultats sont prêts, when je clique sur la bascule, then l'affichage change instantanément sans nouvelle requête réseau

## Implementation Notes

- `app/api/analyze-dimensions/route.js` créée sur le modèle de `/api/score` : prompt système avec les ancrages par dimension (Objectif/Contexte inchangés, Contraintes revu à 3 axes), tool-use forçant `note`/`explanation`/`rewriteSuggestion` par dimension, palier calculé en JS (`paliersFromNote`), `correctionApplied: false` en dur.
- `app/page.js` : phase 4 ajoutée à `handleConfirm` après le succès de la phase 3, bascule `activeView` (état client pur, aucun appel réseau), rendu des 3 cartes en `sm:grid-cols-3` avec la teinte `primary/30` pour "Très clair" (correspond à l'`[ASSUMPTION]` posée dans `DESIGN.md` — non contredite ici, à confirmer visuellement par la PM à l'usage).
- Revue à une lentille (Edge Case Hunter) : 1 signalement reporté (limite de longueur du prompt, doublon d'un gap déjà connu), 1 réfuté (scénario de concurrence non atteignable grâce aux gardes déjà posées en Story 1.5).
- Vérification manuelle : appel automatique confirmé (pas de déclenchement au clic sur la bascule), bascule bidirectionnelle sans requête réseau, 3 notes/paliers cohérents affichés, abandon complet vérifié sur échec simulé de `/api/analyze-dimensions`.
- Note laissée par l'implémentation : l'ancienne route `/api/analyze` (V1, 4 dimensions) existe toujours, non utilisée, non supprimée — hors scope du Code Map de cette story. À nettoyer dans un futur passage (dette technique mineure, pas fonctionnelle).

## Spec Change Log

## Review Triage Log

- **defer** — `app/api/analyze-dimensions/route.js` : aucune limite de longueur sur `prompt` avant l'appel Anthropic. Vérifié : confirmé, mais identique au gap déjà loggé plusieurs fois dans `deferred-work.md` pour `/api/execute`/`/api/score`/`/api/extract-criteria` — pas propre à cette story, même décision de limite globale à trancher un jour. (Edge Case Hunter)
- **false** — "Un `handleCancel` ou un nouveau `handleConfirm` déclenché pendant que `/api/analyze-dimensions` est en vol écraserait le résultat avec un état obsolète." Réfuté : le bouton "Annuler" ne s'affiche que quand `!isConfirmed` (masqué dès le début de `handleConfirm`), et "Envoyer" reste désactivé tant que `isGenerating` est vrai (garde posée en Story 1.5, `canSend`) — `isGenerating` ne repasse à `false` qu'une fois l'appel `/api/analyze-dimensions` résolu, succès ou échec. Aucun chemin UI n'atteint ce scénario. (Edge Case Hunter)

## Verification

**Commands:**
- `npm run build` -- expected: build réussit sans erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- `npm run dev`, envoyer un prompt réel, aller jusqu'à la fin de la notation, vérifier l'appel automatique à `/api/analyze-dimensions` (onglet Réseau), basculer entre les deux vues, vérifier les 3 notes/paliers affichés
- Simuler un échec de `/api/analyze-dimensions` (fetch patché) et vérifier l'abandon complet
