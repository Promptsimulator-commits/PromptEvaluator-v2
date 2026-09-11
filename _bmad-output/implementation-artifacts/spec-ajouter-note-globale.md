---
title: 'Ajouter une note globale (moyenne des 3 dimensions)'
type: 'feature'
created: '2026-09-11'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '7fafdb032d9562ddf6a9a28d4eaee93360dcd3b2'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La vue "Analyse par dimensions" affiche 3 notes indépendantes (Objectif, Contexte, Contraintes) mais aucune synthèse globale — la PM veut retrouver la note unique de la V1 ("Note finale", grande et visible) pour donner un repère immédiat.

**Approche:** Ajouter une note globale = moyenne simple des 3 notes de dimension (arrondie à 1 décimale), affichée avec la même taille/police que la V1 (`font-display text-5xl font-semibold`, libellé en petites capitales au-dessus). Purement calculée côté client à partir de `dimensions` déjà en mémoire — aucun nouvel appel API. Placée en haut de la vue "Analyse par dimensions", au-dessus des 3 cartes.

**Note de décision (annule une décision précédente) :** la session de conception UX du 2026-09-11 avait explicitement abandonné le concept de note globale/moyenne (issu du document de départ V1) au profit de 3 dimensions traitées à égalité, sans "point faible" mis en avant. Cette story réintroduit la moyenne sur demande explicite de la PM — mais **pas** le concept de "point faible" : aucune dimension n'est mise en avant ou dévalorisée, seule une moyenne neutre est ajoutée.

## Boundaries & Constraints

**Always:** calcul = moyenne simple des 3 `dimension.note`, arrondie à 1 décimale ; même taille/police que l'ancienne "Note finale" V1 (`font-display text-5xl font-semibold text-foreground`, libellé `text-xs font-semibold tracking-widest text-primary uppercase`) ; aucun nouvel appel réseau ; les 3 cartes de dimension restent visuellement identiques entre elles (pas de "point faible" mis en avant).

**Never:** ne pas afficher de dimension comme "la plus faible" ; ne pas modifier `/api/analyze-dimensions` ni aucune route ; ne pas toucher à la vue "Réponses générées".

## Code Map

- `app/page.js` -- section "Analyse par dimensions" : ajouter un bloc note globale entre le titre de section et la grille des 3 cartes, calculé via `dimensions.reduce(...)/3`
- Référence de style V1 (ancien code, avant Story 1.2) : bloc "Note finale" avec libellé + grand chiffre + `/ 10` en plus petit — reprendre exactement cette hiérarchie typographique

## Tasks & Acceptance

**Execution:**
- [x] `app/page.js` -- calcul de la moyenne des 3 notes (arrondie à 1 décimale) ; bloc affiché en haut de la vue Analyse, libellé "Note globale", chiffre en `text-5xl font-display font-semibold`

**Acceptance Criteria:**
- Given l'analyse par dimensions est affichée, when je consulte la vue Analyse, then une note globale (moyenne des 3 dimensions, arrondie à 1 décimale) est visible en haut, dans la même taille/police que l'ancienne "Note finale" V1
- Given les 3 notes sont par exemple 8, 3, 7, when la moyenne est calculée, then elle affiche 6,0 (arrondie à 1 décimale, notation française à la virgule)
- Given la note globale est affichée, when j'observe les 3 cartes, then aucune n'est visuellement mise en avant comme "point faible"

## Implementation Notes

- `formatScore` (repris de la V1) + bloc "Note globale" (même hiérarchie typographique que l'ancienne "Note finale" V1) inséré entre le titre "Analyse par dimensions" et la grille des 3 cartes. Calcul 100% client, aucun nouvel appel réseau.
- Revue à une lentille (Edge Case Hunter) : 1 correctif appliqué (`minimumFractionDigits: 1` manquant, affichait "6" au lieu de "6,0"), 3 signalements réfutés (non atteignables — le contrat de `/api/analyze-dimensions` garantit déjà exactement 3 dimensions avec des notes valides).
- Vérification manuelle : notes 9/6/8 → "Note globale — 7,7 / 10" affiché correctement, aucune carte mise en avant comme point faible.

## Spec Change Log

## Review Triage Log

- **patch** — `formatScore` utilisait `toLocaleString("fr-FR", { maximumFractionDigits: 1 })` sans `minimumFractionDigits`, affichant "6" au lieu de "6,0" pour une moyenne entière — contredit directement l'exemple du critère d'acceptation ("8, 3, 7 → 6,0"). Vérifié : confirmé, `(6).toLocaleString("fr-FR", {maximumFractionDigits:1})` renvoie "6" sans décimale forcée. Fix trivial (`minimumFractionDigits: 1` ajouté). (Edge Case Hunter, claims check)
- **false** — "`dimensions` pourrait être un tableau vide, causant une division par zéro (NaN)." Réfuté : la route `/api/analyze-dimensions` valide déjà `dimensions.length !== DIMENSIONS.length` (3 exactement) avant de répondre avec succès — un tableau vide ne peut jamais atteindre `setDimensions`. (Edge Case Hunter)
- **false** — "Une `dimension.note` pourrait être `null`/non numérique." Réfuté : même route, même validation déjà en place depuis la Story 2.1 (`Number.isInteger(dimension?.note) && ... `) — une note invalide déclenche une erreur serveur, jamais une réponse acceptée. (Edge Case Hunter)
- **false** — "Le score pourrait être `NaN` et s'afficher tel quel." Réfuté : conséquence des deux points ci-dessus, eux-mêmes non atteignables. (Edge Case Hunter)

## Verification

**Commands:**
- `npm run build` -- expected: build réussit sans erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- `npm run dev`, générer une analyse, vérifier la note globale affichée et son calcul (moyenne exacte des 3 notes visibles)
