---
title: 'Appliquer la correction comportementale à la note'
type: 'feature'
created: '2026-09-11'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'b7d9c2c7094bd3416d97b1090a493c8a05914862'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Depuis la Story 2.1, chaque dimension n'a qu'une note textuelle — la divergence entre les N réponses générées (le "signal comportemental") n'est pas prise en compte, alors qu'un prompt peut sembler clair à la lecture mais s'avérer ambigu en pratique.

**Approche:** Étendre `/api/analyze-dimensions` pour recevoir aussi les N réponses générées (`responses`) et les résultats de notation (`scoreResults`), et corriger la note textuelle de chaque dimension selon 3 niveaux de divergence (faible/modérée/forte → -0/-2/-4), avant de la traduire en palier. Contraintes se calcule en code (taux de réponses en défaut sur un critère, déterministe) ; Objectif et Contexte sont jugés qualitativement par le modèle à partir du texte des réponses (sujet/angle/détail pour Objectif, ton pour Contexte). À N=1, aucune correction n'est possible.

**Note de scope inter-story :** l'explication concrète de la correction (`correctionDetail`) est calculée ici mais son affichage dans le détail dépliable de chaque dimension reste Story 2.3 — pas encore construite.

## Boundaries & Constraints

**Always:** correction appliquée avant la traduction en palier ; mêmes 3 niveaux/points pour les 3 dimensions (faible=-0, modérée=-2, forte=-4) ; `correctionApplied` vrai uniquement si la correction est non nulle (modérée ou forte — une divergence faible ne compte pas comme "appliquée") ; à N=1 (un seul élément dans `responses`), `correctionApplied` toujours `false` sur les 3 dimensions, sans exception.

**Never:** ne pas afficher `correctionDetail` dans l'UI (rendu = Story 2.3) ; ne pas exposer de delta de points brut (type "-2 points") dans `correctionDetail` — toujours une phrase concrète sur ce qui a varié ; ne pas modifier `/api/execute`, `/api/extract-criteria`, `/api/score`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| N=1 | `responses` à 1 élément (ou absent) | `correctionApplied: false` sur les 3 dimensions, note = signal textuel seul | N/A |
| Contraintes, 0% d'échec | aucune réponse en défaut sur un critère | correction faible (-0), `correctionApplied: false` | N/A |
| Contraintes, 1-33% d'échec | ex. 1 réponse sur 5 en défaut | correction modérée (-2), `correctionApplied: true` | N/A |
| Contraintes, >33% d'échec | ex. 2 réponses sur 5 en défaut | correction forte (-4), `correctionApplied: true` | N/A |
| Objectif/Contexte, réponses cohérentes | divergence jugée faible par le modèle | `correctionApplied: false` | N/A |
| Objectif/Contexte, réponses divergentes | divergence jugée modérée/forte | note corrigée, `correctionDetail` concret renvoyé | N/A |
| Note déjà à 0 après correction | note textuelle basse + forte correction | note plafonnée à 0 (jamais négative) | N/A |

</frozen-after-approval>

## Code Map

- `app/api/analyze-dimensions/route.js` -- étendre le body accepté (`responses`, `scoreResults`, en plus de `prompt`) ; calcul Contraintes en JS (taux d'échec à partir de `scoreResults`) ; second appel Anthropic (tool-use) pour la divergence Objectif/Contexte à partir de `responses` (niveau + `correctionDetail`) ; appliquer la correction avant `paliersFromNote` ; note plafonnée à `Math.max(0, note - correction)`
- `app/page.js` -- `handleConfirm`, phase 4 : envoyer `responses: generatedRuns` et `scoreResults: results` en plus de `prompt` à `/api/analyze-dimensions`
- `_bmad-output/planning-artifacts/architecture/architecture-prompt-evaluator-2026-09-04/ARCHITECTURE-SPINE-v2.md` -- AD-4b déjà mis à jour (contrat `responses` ajouté) ; référence de contrat, ne pas re-décider
- `app/api/score/route.js`, `app/api/execute/route.js`, `app/api/extract-criteria/route.js` -- ne pas modifier

## Tasks & Acceptance

**Execution:**
- [x] `app/api/analyze-dimensions/route.js` -- accepter `responses`/`scoreResults` ; calcul déterministe de la correction Contraintes (taux d'échec) -- FR9, FR10
- [x] `app/api/analyze-dimensions/route.js` -- second appel Anthropic pour la divergence Objectif/Contexte (niveau faible/modérée/forte + `correctionDetail` concret) à partir de `responses` -- FR9, FR10
- [x] `app/api/analyze-dimensions/route.js` -- application de la correction avant palier, plafonnée à 0 ; `correctionApplied`/`correctionDetail` corrects (false/absent si correction nulle ou N=1) -- FR10
- [x] `app/page.js` -- transmettre `responses`/`scoreResults` dans l'appel de phase 4 -- FR9

**Acceptance Criteria:**
- Given N ≥ 2 réponses générées et notées, when la note de Contraintes est calculée, then le taux de réponses en défaut sur au moins un critère détermine la correction (0%=faible/-0, 1-33%=modérée/-2, >33%=forte/-4)
- Given N ≥ 2 réponses générées, when la note d'Objectif ou de Contexte est calculée, then la divergence qualitative jugée par le modèle (sujet/angle/détail pour Objectif, ton pour Contexte) détermine la même correction
- Given N = 1, when une dimension est notée, then aucune correction n'est appliquée et `correctionApplied` est `false` sur les 3 dimensions
- Given une correction non nulle a été appliquée, when le résultat est renvoyé, then `correctionDetail` décrit concrètement ce qui a varié, jamais un delta de points brut

## Implementation Notes

- `/api/analyze-dimensions` étendue : Contraintes calculée en JS (déterministe) à partir de `scoreResults` ; Objectif/Contexte jugés par un second appel Anthropic (`judgeDivergence`) lisant le texte des `responses`. Correction plafonnée à 0, appliquée avant `paliersFromNote`. Contrat AD-4b corrigé dans `ARCHITECTURE-SPINE-v2.md` pour refléter l'ajout de `responses` au payload (nécessaire au jugement qualitatif, que `scoreResults` seul ne permettait pas).
- `maxDuration` de la route doublé (60→120s) suite à la revue : deux appels séquentiels dans le même budget de temps qu'un seul auparavant.
- Revue à une lentille (Edge Case Hunter) : 1 correctif appliqué (`maxDuration`), 1 signalement reporté (limite de longueur, doublon connu), 2 réfutés (chemins non atteignables via le client réel, déjà validés en amont), 1 rejeté (risque de fuite d'un delta de points, fix non trivial et risqué).
- Vérification manuelle : N=1 → aucune correction sur les 3 dimensions ; prompt vague N=5 → corrections réelles sur Contexte et Contraintes avec détails concrets, Objectif jugé cohérent ; aucun delta de points brut observé dans les textes retournés.

## Spec Change Log

## Review Triage Log

- **patch** — `app/api/analyze-dimensions/route.js` : `maxDuration` restait à 60s alors que cette story ajoute un second appel Anthropic séquentiel (notation puis divergence). Vérifié : confirmé, deux appels dans le même budget de temps qu'un seul auparavant. Fix trivial (`maxDuration = 120`). (Edge Case Hunter)
- **defer** — Aucune limite de longueur sur le texte concaténé des `responses` avant l'appel de jugement de divergence. Vérifié : confirmé, mais même pattern déjà loggé plusieurs fois dans `deferred-work.md` pour d'autres routes — pas propre à cette story.
- **false** — "Une entrée `scoreResults` non-tableau (ex. `null`) serait silencieusement traitée comme non défaillante." Réfuté : `scoreResults` provient exclusivement de la boucle de notation (Story 1.5), qui n'accepte déjà que des tableaux valides (`Array.isArray(data?.results)` vérifié côté client avant tout ajout) — aucun chemin réel n'envoie une entrée malformée. (Edge Case Hunter)
- **false** — "Des entrées non-string filtrées dans `responses` désynchroniseraient sa longueur de celle de `scoreResults`, désactivant silencieusement la correction Contraintes." Réfuté : `responses` provient exclusivement de `generatedRuns` (Story 1.4), déjà garanti composé de chaînes valides avant tout ajout — aucun chemin réel n'envoie une entrée non-string. (Edge Case Hunter, claims check)
- **low, rejected (fix non trivial, risque de faux positifs)** — Le modèle pourrait, malgré la consigne, glisser un delta de points brut (type "-2 points") dans `correctionDetail`. Réel en théorie mais peu probable (même consigne respectée sans incident dans `/api/score` sur plusieurs stories) ; un filtre par regex risquerait de rejeter des phrases légitimes contenant des chiffres (ex. "2 réponses sur 5"). (Edge Case Hunter, claims check)

## Verification

**Commands:**
- `npm run build` -- expected: build réussit sans erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- `npm run dev`, envoyer un prompt avec N=1 : vérifier `correctionApplied: false` partout (inspection réseau, réponse de `/api/analyze-dimensions`)
- Envoyer un prompt vague avec N≥3 (probable divergence) : vérifier une correction non nulle sur au moins une dimension et un `correctionDetail` concret
- Envoyer un prompt très précis avec des contraintes claires, N≥3 : vérifier une correction faible/nulle
