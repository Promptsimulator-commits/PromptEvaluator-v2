---
title: 'Afficher le détail pédagogique dépliable par dimension et confirmer la bascule Réponses/Analyse'
type: 'feature'
created: '2026-09-11'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'a13e84fde1d965879062aca817f4f939c3f938c4'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Depuis la Story 2.2, chaque dimension porte déjà toute l'information pédagogique (`explanation`, `rewriteSuggestion`, `correctionApplied`, `correctionDetail`), mais les cartes ne l'affichent pas — seuls la note et le palier sont visibles.

**Approche:** Rendre les 3 cartes dépliables (clic pour ouvrir/fermer, indépendamment les unes des autres), affichant en développé : ce qui est bien fait, ce qui reste à clarifier, une reformulation concrète, et — uniquement si `correctionApplied` est vrai — une phrase nommant ce qui a varié entre les réponses (`correctionDetail`). Cette story fusionne deux stories de l'epic (2.3 et 2.4) sur décision de la PM : la bascule Réponses/Analyse (2.4) a déjà été construite en Story 2.1 et satisfait déjà ses propres critères d'acceptation — cette story se contente de le vérifier, le vrai travail neuf est le détail dépliable (2.3).

## Boundaries & Constraints

**Always:** chaque carte se déplie/replie indépendamment (pas d'accordéon exclusif) ; `aria-expanded` sur l'en-tête cliquable, `aria-controls` reliant au panneau de détail ; la section de correction ne s'affiche que si `dimension.correctionApplied` est vrai ; aucune donnée supplémentaire n'est demandée au serveur (tout provient déjà de `dimensions`, calculé en Story 2.1/2.2).

**Never:** ne pas modifier `/api/analyze-dimensions` ni aucune autre route ; ne pas afficher de delta de points brut ; ne pas rendre l'expansion d'une carte exclusive des autres.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Carte collapsed (défaut) | dimension chargée | note + palier visibles, détail masqué | N/A |
| Clic sur une carte | carte collapsed | se déplie : explication, ce qui est à clarifier, reformulation | N/A |
| Reclic sur la même carte | carte expanded | se replie | N/A |
| `correctionApplied: true` | dimension corrigée | phrase concrète de `correctionDetail` visible dans le détail | N/A |
| `correctionApplied: false` | dimension non corrigée (ou N=1) | aucune section de correction affichée | N/A |
| Une carte dépliée, clic sur une autre | 2 cartes indépendantes | la première reste dépliée, la seconde se déplie aussi | N/A |
| Bascule Réponses/Analyse (vérification 2.4) | résultats prêts | comportement déjà conforme (Story 2.1) — non re-décidé ici | N/A |

</frozen-after-approval>

## Code Map

- `app/page.js` -- section "Analyse par dimensions" (Story 2.1) : ajouter un état d'expansion par dimension (ex. `expandedDimensions`, objet ou Set des noms dépliés) ; rendre l'en-tête de carte cliquable (`aria-expanded`, `aria-controls`) ; ajouter le panneau de détail (explanation/rewriteSuggestion toujours ; correctionDetail seulement si `correctionApplied`)
- Bascule `activeView`/bouton "Voir l'analyse"/"Voir les réponses" (déjà présents depuis Story 2.1) -- ne pas modifier, seulement vérifier manuellement que l'AC de la Story 2.4 est bien satisfaite telle quelle
- `app/api/analyze-dimensions/route.js`, `app/api/score/route.js`, `app/api/execute/route.js`, `app/api/extract-criteria/route.js` -- ne pas modifier

## Tasks & Acceptance

**Execution:**
- [x] `app/page.js` -- état d'expansion par dimension (indépendant, pas d'accordéon exclusif) -- FR10
- [x] `app/page.js` -- en-tête de carte cliquable avec `aria-expanded`/`aria-controls` ; panneau de détail (explanation, rewriteSuggestion) -- FR10
- [x] `app/page.js` -- section correction conditionnelle (`correctionDetail`, seulement si `correctionApplied`) -- FR10

**Acceptance Criteria:**
- Given une carte de dimension collapsed, when je clique dessus, then elle se déplie et affiche explication + reformulation, avec `aria-expanded="true"`
- Given une carte dépliée, when je reclique dessus, then elle se replie
- Given deux cartes différentes, when j'en déplie une puis l'autre, then les deux restent indépendamment dépliées (pas d'accordéon)
- Given `correctionApplied: true` sur une dimension, when sa carte est dépliée, then une phrase concrète de `correctionDetail` est visible
- Given `correctionApplied: false` (ou N=1), when la carte est dépliée, then aucune section de correction ne s'affiche
- Given les résultats sont prêts (vérification, pas nouveau code), when je clique sur la bascule, then le comportement de la Story 2.4 (libellé de la vue inactive, "Réponses générées" par défaut, pas de nouvel appel réseau) est déjà satisfait

## Implementation Notes

- `expandedDimensions` (état `Set`) + `toggleDimensionExpanded` : chaque carte indépendante, aucun accordéon exclusif. Réinitialisé à chaque nouvelle analyse (`handleConfirm`) et à l'annulation (`handleCancel`).
- En-tête de carte devenu `<button>` avec `aria-expanded`/`aria-controls`/`id` liés au panneau (`role="region"`, `aria-labelledby`). Panneau : `explanation` + `rewriteSuggestion` toujours ; `correctionDetail` seulement si `correctionApplied` (et non vide).
- Story 2.4 (bascule Réponses/Analyse) : déjà entièrement construite en Story 2.1, revérifiée manuellement sans régression — aucun code changé pour cette partie.
- Revue à une lentille (Edge Case Hunter) : 3 signalements, tous réfutés (noms de dimension contraints par un contrat fixe déjà validé côté serveur ; forme du champ `explanation` déjà établie et hors scope de cette story). Aucun correctif nécessaire.
- Vérification manuelle : dépliage indépendant de plusieurs cartes simultanément confirmé, section correction affichée uniquement quand pertinente, bascule Réponses/Analyse sans appel réseau supplémentaire.

## Spec Change Log

## Review Triage Log

- **false** — "Deux dimensions pourraient partager le même `dimension.name`, faisant se replier/déplier la mauvaise carte." Réfuté : `DIMENSIONS` est un tableau fixe à 3 éléments (`objectif`/`contexte`/`contraintes`), contraint par un `enum` dans le schéma tool-use et vérifié positionnellement (`dimension?.name !== DIMENSIONS[index]`) depuis la Story 2.1 — un doublon est structurellement impossible. (Edge Case Hunter)
- **false** — "`dimension.name` pourrait contenir des espaces/caractères invalides pour un `id` HTML." Réfuté : même contrainte que ci-dessus — les 3 noms possibles sont des mots ASCII simples, valides sans échappement. (Edge Case Hunter)
- **false** — "Le panneau affiche un `explanation` fusionné au lieu de deux champs distincts 'bien fait'/'à clarifier'." Réfuté : `explanation` est un champ unique délibéré depuis la Story 2.1 (le prompt système de `/api/analyze-dimensions` demande explicitement "un court paragraphe : ce qui est bien fait, puis ce qui pourrait être plus clair" en une seule chaîne) — modifier cette forme reviendrait à toucher la route, explicitement hors scope de cette story. (Edge Case Hunter, claims check)

## Verification

**Commands:**
- `npm run build` -- expected: build réussit sans erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- `npm run dev`, générer une analyse (idéalement avec N≥3 pour obtenir au moins une correction appliquée), déplier/replier chaque carte indépendamment, vérifier la présence/absence de la section correction selon `correctionApplied`
- Revérifier la bascule Réponses/Analyse (déjà construite) pour confirmer qu'elle satisfait toujours l'AC de la Story 2.4 sans régression
