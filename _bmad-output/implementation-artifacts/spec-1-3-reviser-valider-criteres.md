---
title: 'Réviser et valider la liste de critères extraits'
type: 'feature'
created: '2026-09-11'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '0c319d5e49b32b8b07967ebaa809d19bf4fb1a24'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Depuis la Story 1.2, les critères extraits s'affichent en liste brute non modifiable — l'utilisateur ne peut ni corriger une extraction imparfaite, ni ajouter un critère manqué, ni annuler pour revenir au prompt.

**Approche:** Remplacer la liste brute par une liste éditable (édition en place, suppression par ligne, ajout d'une ligne) avec un chip de comptage en direct, et deux actions : "Confirmer et lancer" (verrouille la liste, prépare la génération) et "Annuler" (referme la liste, retour au prompt inchangé). La génération elle-même (appels `/api/execute`) reste hors scope — Story 1.4, pas encore construite.

**Note de scope inter-story :** au clic sur "Confirmer et lancer", la liste se verrouille et un message d'attente minimal s'affiche à la place de la génération réelle (placeholder, remplacé par Story 1.4) — même logique que le placeholder minimal de la Story 1.2 pour l'affichage des critères.

## Boundaries & Constraints

**Always:** une seule liste, sans regroupement visuel des critères fixes (qui n'y figurent jamais — inchangé depuis 1.2) ; chip de comptage mis à jour en direct, singulier/pluriel ("0 critère", "1 critère", "2 critères") ; "Confirmer et lancer" désactivé si la liste est vide ; "Annuler" referme la liste et restaure l'état de saisie initial sans toucher au texte du prompt.

**Never:** ne pas appeler `/api/execute` ni implémenter la boucle de génération (Story 1.4) ; ne pas toucher `/api/extract-criteria`, `/api/execute`, `/api/score` ; ne pas réintroduire un champ "critères" tapé à la main ; ne pas permettre l'édition de la liste une fois "Confirmer et lancer" cliqué (verrouillée jusqu'à un nouvel "Envoyer").

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Liste extraite non vide | `extractedCriteria` reçu de 1.2 | liste éditable affichée, chip "N critères" | N/A |
| Édition d'une ligne | l'utilisateur modifie le texte d'un critère | la valeur est mise à jour en état local | N/A |
| Suppression d'une ligne | clic sur ✕ | la ligne disparaît, le chip se met à jour | N/A |
| Ajout d'une ligne | clic sur "+ Ajouter un critère" | une ligne vide éditable apparaît, focus dessus | N/A |
| Suppression de toutes les lignes | liste vidée par l'utilisateur | "Confirmer et lancer" se désactive | N/A |
| Confirmer avec liste non vide | clic sur "Confirmer et lancer" | liste verrouillée (lecture seule), message placeholder affiché | N/A |
| Annuler | clic sur "Annuler" | liste fermée, retour au prompt (inchangé), aucun appel réseau | N/A |

</frozen-after-approval>

## Code Map

- `app/page.js` -- ajouter l'état de la liste éditable (dérivé de `extractedCriteria`), les actions ajouter/supprimer/éditer, "Confirmer et lancer"/"Annuler", et l'état verrouillé post-confirmation ; remplacer le bloc `<ul>` en lecture seule de la Story 1.2 par cette nouvelle section
- `_bmad-output/planning-artifacts/ux-designs/ux-prompt-evaluator-2026-09-08/mockups/criteria-validation-panel.html` -- référence visuelle (rangées éditables + ✕, bouton pointillé "+ Ajouter un critère", boutons Confirmer/Annuler) ; s'appuyer sur les tokens `DESIGN.md` déjà utilisés dans `app/page.js` (pas de nouvelle couleur)
- `app/api/extract-criteria/route.js`, `app/api/execute/route.js`, `app/api/score/route.js` -- ne pas modifier

## Tasks & Acceptance

**Execution:**
- [x] `app/page.js` -- état local de la liste éditable initialisé depuis `extractedCriteria` (copie modifiable, pas la même référence) ; handlers ajouter/supprimer/éditer une ligne ; chip de comptage live (accord singulier/pluriel) -- FR2a
- [x] `app/page.js` -- bouton "Confirmer et lancer" (désactivé si liste vide ou critère blanc) : verrouille la liste et affiche un état "prêt pour la génération" (placeholder, pas d'appel réseau) -- FR2a
- [x] `app/page.js` -- bouton "Annuler" : réinitialise `extractedCriteria`/l'état d'édition à `null`, prompt non touché, aucune régénération d'extraction -- FR2a

**Acceptance Criteria:**
- Given l'extraction a renvoyé une liste, when elle s'affiche, then chaque critère est dans un champ éditable avec un bouton de suppression, plus un bouton "+ Ajouter un critère", et le chip reflète le nombre courant
- Given je vide la liste, when il ne reste plus aucun critère, then "Confirmer et lancer" est désactivé
- Given une liste non vide, when je clique sur "Confirmer et lancer", then la liste devient non éditable et un état "prêt" s'affiche, sans appel à `/api/execute`
- Given la liste est affichée (avant confirmation), when je clique sur "Annuler", then je reviens à l'état de saisie initial, le prompt est inchangé, et aucune requête n'est faite

## Implementation Notes

- État `criteriaList` (copie modifiable de `extractedCriteria`) + `isConfirmed` ; handlers `handleEditCriterion`/`handleRemoveCriterion`/`handleAddCriterion`/`handleConfirm`/`handleCancel`. Focus automatique sur la nouvelle ligne ajoutée via `useRef` + `useEffect`.
- Revue allégée (une seule lentille, Edge Case Hunter, décision de coût en tokens pour l'après-midi) : 1 correctif appliqué (garde contre un critère vide/blanc au moment de "Confirmer et lancer", sur le bouton et le handler), 1 point réel mais mineur reporté dans `deferred-work.md` (perte de focus clavier possible en supprimant une ligne, clé React par index), 2 signalements réfutés (sémantique de liste, accord singulier/pluriel — voir Review Triage Log).
- `app/api/extract-criteria/route.js`, `app/api/execute/route.js`, `app/api/score/route.js` non modifiés, conformément au scope.
- Vérification manuelle complète dans le navigateur (édition, suppression, ajout avec focus, liste vidée → bouton désactivé, confirmer → verrouillage sans appel réseau, annuler → retour au prompt intact, navigation clavier).

## Spec Change Log

## Review Triage Log

- **patch** — `app/page.js`, `handleConfirm` : ne vérifie que `criteriaList.length === 0`, pas si un critère est vide/blanc après édition — un critère vidé par l'utilisateur peut être verrouillé tel quel par "Confirmer et lancer". Vérifié : confirmé, aucun `.trim()` sur le contenu. Fix trivial (garde sur le contenu, en plus de la longueur). (Edge Case Hunter)
- **low, rejected (fix non trivial)** — Les lignes de critères utilisent `index` comme clé React ; supprimer une ligne peut faire perdre le focus clavier sur une ligne en cours d'édition située après (le DOM node focus est démonté, pas réutilisé). Vérifié : confirmé par lecture du code (React réutilise/détruit les nœuds par clé, pas par identité de donnée). Réel mais mineur (la valeur affichée reste correcte, seul le focus saute) ; le fix propre (identifiants stables par critère) change la forme de l'état (tableau de chaînes → tableau d'objets `{id, texte}`) sur 4 handlers, plus qu'une correction directe. Reporté dans `deferred-work.md`. (Edge Case Hunter)
- **false** — "Le rendu `<div>` (ex-`<ul>`/`<li>` en Story 1.2) supprime la sémantique de liste pour les lecteurs d'écran." Réfuté : chaque champ conserve un `aria-label` explicite ("Critère N"), qui est le mécanisme réellement porteur d'accessibilité pour un ensemble de champs de formulaire édités — un rôle "liste" n'est pas la convention standard pour des champs de saisie, contrairement à du contenu statique (le cas de la Story 1.2). (Edge Case Hunter, deletion check)
- **false** — "Le chip devrait afficher un pluriel pour 0 critère, pas le singulier." Réfuté : convention déjà établie et documentée (`EXPERIENCE.md` Voice and Tone — "0 critère"/"1 critère"/"2 critères", singulier en dessous de 2) et déjà appliquée ailleurs dans ce fichier (`runCount`) ; le code (`length > 1 ? "s" : ""`) l'implémente correctement. (Edge Case Hunter, claims check)

## Verification

**Commands:**
- `npm run build` -- expected: build réussit sans erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- `npm run dev`, envoyer un prompt réel, puis : éditer une ligne, en supprimer une, en ajouter une (vérifier le focus), vider la liste (bouton désactivé), la re-remplir, cliquer "Confirmer et lancer" (liste verrouillée, pas de requête réseau visible dans l'onglet Réseau), recommencer et cliquer "Annuler" (retour au prompt, prompt intact)
- Vérifier au clavier (tab) que chaque champ/bouton de la liste reste accessible sans souris
