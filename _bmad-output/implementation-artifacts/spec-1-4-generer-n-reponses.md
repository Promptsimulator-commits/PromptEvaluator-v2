---
title: 'Générer N réponses de façon sécurisée'
type: 'feature'
created: '2026-09-11'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'f30c39e8507894d7fc839a4edcd117329fe75b01'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Depuis la Story 1.3, "Confirmer et lancer" ne fait que verrouiller la liste de critères et afficher un message statique "prêt pour la génération (à venir)" — aucune réponse n'est réellement générée.

**Approche:** Remplacer ce placeholder par la génération réelle : au clic sur "Confirmer et lancer", appeler `/api/execute` N fois (N = valeur du curseur au moment du clic, figée), chaque appel dans un contexte neuf, afficher les réponses au fur et à mesure en texte brut, désactiver le curseur pendant la génération, et abandonner tout le flux avec un message d'erreur clair si un seul appel échoue.

**Note de scope inter-story :** la notation en arrière-plan de chaque réponse (`/api/score`, Story 1.5) n'est pas construite ici — les réponses s'affichent sans aucun score.

## Boundaries & Constraints

**Always:** N est figé à la valeur du curseur au moment du clic sur "Confirmer et lancer", inchangé même si le curseur est retouché ensuite ; chaque appel `/api/execute` est indépendant (pas d'historique partagé, AD-3) ; la clé API n'est lue que côté serveur (AD-1) ; un seul échec abandonne tout le flux, aucun résultat partiel n'est présenté comme final.

**Never:** ne pas appeler `/api/score` ni construire de notation/divergence (Story 1.5) ; ne pas modifier `/api/execute`, `/api/extract-criteria`, `/api/score` ; ne pas permettre de relancer une génération déjà en cours (pas de second clic concurrent) ; ne pas réactiver l'édition de la liste de critères après confirmation (déjà verrouillée depuis 1.3).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Confirmer avec N=5 (défaut) | liste validée, curseur à 5 | 5 appels `/api/execute` séquentiels, réponses affichées au fur et à mesure | N/A |
| Génération en cours | après clic | curseur désactivé, `aria-live="polite"` affiche "exécution i/N" | N/A |
| Un appel échoue (i-ème sur N) | erreur serveur ou réseau | tout le flux abandonné, aucune réponse partielle affichée | panneau `role="alert"` précisant quel appel a échoué |
| Curseur modifié après confirmation | l'utilisateur déplace le curseur pendant/après une génération en cours | sans effet sur la génération en cours (N déjà figé) | N/A |
| Toutes les réponses générées avec succès | N/N réussis | vue "Réponses générées" affiche les N textes bruts, sans score | N/A |

</frozen-after-approval>

## Code Map

- `app/page.js` -- `handleConfirm` devient asynchrone : verrouille la liste (inchangé), puis boucle N appels `/api/execute` (nouvel état `isGenerating`, `runs`, `totalRuns`, `generationError`) ; remplacer le message statique "prêt pour la génération" par le rendu progressif des réponses
- `app/api/execute/route.js` -- référence de contrat uniquement (`{prompt}` → `{output}`), ne pas modifier
- Ancien code V1 (`git show 1828935:app/page.js` si besoin de référence) -- `handleEvaluate` y illustrait déjà la boucle séquentielle + abandon-sur-échec ; le motif est repris, pas le code (critères/score n'existent plus sous cette forme)

## Tasks & Acceptance

**Execution:**
- [x] `app/page.js` -- `handleConfirm` : verrouille la liste, fige `totalRuns = runCount`, boucle séquentielle `for` sur `/api/execute`, met à jour `runs` au fur et à mesure -- FR3, FR3b
- [x] `app/page.js` -- gestion d'échec : si un appel échoue, vider `runs`, régler `generationError`, arrêter la boucle -- NFR4
- [x] `app/page.js` -- curseur N : `disabled` étendu à `isGenerating` ; section "Réponses générées" (texte brut par réponse, sans score) -- FR7

**Acceptance Criteria:**
- Given la liste de critères est validée et le curseur réglé sur N, when je clique sur "Confirmer et lancer", then l'application appelle `/api/execute` N fois en contexte neuf et affiche les réponses au fur et à mesure
- Given une génération est en cours, when j'observe l'écran, then le curseur est désactivé et un indicateur `aria-live="polite"` affiche la progression ("exécution i/N")
- Given un des N appels échoue, when l'erreur survient, then tout le flux est abandonné, un panneau `role="alert"` précise quel appel a échoué, et aucune réponse partielle n'est affichée comme résultat final
- Given les N appels réussissent, when la génération se termine, then les N réponses sont visibles en texte brut, sans score individuel

## Implementation Notes

- `handleConfirm` devenu asynchrone : verrouille la liste, fige `totalRuns`, boucle séquentielle sur `/api/execute`, abandon complet (vide `runs`, message précis) au premier échec. `handleCancel` réinitialise aussi le nouvel état de génération.
- Revue à une lentille (Edge Case Hunter) : 3 signalements, tous réfutés à la vérification (curseur natif borné 1-10, page unique sans démontage possible, contrat d'erreur déjà garanti et déjà utilisé sans type-check depuis la Story 1.2). Aucun correctif nécessaire.
- Vérification manuelle : génération réelle (N=2) avec affichage progressif, et échec simulé (fetch de `/api/execute` patché) confirmant l'abandon complet, le message précis, et la liste de critères restant verrouillée.

## Spec Change Log

## Review Triage Log

- **false** — "`runCount` pourrait valoir 0 ou NaN au clic sur Confirmer, bouclant silencieusement sans résultat." Réfuté : le curseur est un `<input type="range" min={1} max={10} step={1}>`, valeur initiale 5 — la plage native ne permet jamais d'atteindre 0 ou une valeur non numérique via l'UI ; aucun autre point n'écrit dans `runCount`. (Edge Case Hunter)
- **low, rejected (fix non trivial, non atteignable en usage réel)** — Si le composant se démontait pendant la boucle de génération (navigation), les `setState` différés s'exécuteraient sur un composant démonté. Réel en théorie, mais cette app est une page unique sans routage ni démontage possible en usage normal ; le fix (AbortController/ref de montage) ajouterait de la complexité pour un scénario inatteignable ici. (Edge Case Hunter)
- **false** — "`data.error` non-string produirait un affichage `[object Object]`." Réfuté : `/api/execute` garantit `{error: string}` (AD-2, `lib/anthropic.js`) ; ce même motif `data?.error ?? fallback` sans vérification de type est déjà utilisé sans incident depuis la Story 1.2 (`handleSend`) — pas une régression propre à cette story. (Edge Case Hunter)

## Verification

**Commands:**
- `npm run build` -- expected: build réussit sans erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- `npm run dev`, envoyer un prompt réel, valider les critères, lancer avec N=2 ou 3 (limiter le coût API) : vérifier l'affichage progressif, le curseur désactivé, l'indicateur de progression
- Simuler un échec (ex. couper la clé API ou patcher `fetch`) pour vérifier l'abandon complet et le message d'erreur
