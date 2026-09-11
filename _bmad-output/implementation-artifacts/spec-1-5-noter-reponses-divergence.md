---
title: 'Noter chaque réponse en arrière-plan pour mesurer la divergence'
type: 'feature'
created: '2026-09-11'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'e12ea65791c5da83f4d2a4659b5f94df5271e292'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Depuis la Story 1.4, les N réponses sont générées et affichées, mais rien ne les note contre les critères — la divergence entre réponses (nécessaire à la correction comportementale de l'Épic 2) n'est pas mesurée.

**Approche:** Une fois les N réponses générées avec succès, appeler `/api/score` pour chacune (contexte neuf), en y injectant les 3 critères fixes **côté serveur uniquement** (jamais envoyés par le client, jamais distingués dans la réponse). Stocker le résultat par réponse en mémoire, sans jamais l'afficher — il n'alimente que l'Épic 2 (notation par dimension), pas encore construit.

**Note de scope inter-story :** aucun affichage n'est ajouté par cette story ; le résultat de notation reste un état interne muet jusqu'à l'Épic 2.

## Boundaries & Constraints

**Always:** la notation ne démarre qu'une fois les N exécutions terminées avec succès (pas d'entrelacement génération/notation, AD-4) ; chaque appel `/api/score` est indépendant (contexte neuf, AD-3) ; les 3 critères fixes sont une constante définie uniquement dans `app/api/score/route.js`, jamais acceptée en entrée, jamais renvoyée sous une forme distinguable ; un seul échec de notation abandonne tout le flux (comme un échec de génération, NFR4).

**Never:** ne pas afficher `results`/le score par réponse dans l'UI, sous quelque forme que ce soit ; ne pas construire la notation par dimension (Épic 2) ; ne pas envoyer les critères fixes depuis le client ; ne pas modifier `/api/execute` ni `/api/extract-criteria`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| N réponses générées avec succès | `runs` complet (N éléments) | `/api/score` appelé N fois (un par réponse), résultat stocké en mémoire, jamais affiché | N/A |
| Critères fixes | requête `/api/score` | les 3 critères fixes sont ajoutés par la route elle-même, absents du corps envoyé par le client | N/A |
| Un appel `/api/score` échoue | erreur serveur ou réseau | tout le flux abandonné (comme Story 1.4), y compris les réponses déjà affichées | panneau `role="alert"` précisant quel appel de notation a échoué |
| Réponse échoue sur un critère fixe | verdict `passed: false` sur un critère fixe | information conservée en mémoire (consommée par l'Épic 2 plus tard), jamais affichée séparément | N/A |

</frozen-after-approval>

## Code Map

- `app/api/score/route.js` -- ajouter une constante `FIXED_CRITERIA` (3 critères : orthographe/grammaire, cohérence interne, même langue que le prompt) ; la concaténer aux `criteria` reçus **avant** l'appel Anthropic et la validation de longueur des verdicts (actuellement `verdicts.length !== criteria.length`, doit devenir `!== allCriteria.length`) ; ne rien changer au contrat `{output, criteria}` en entrée côté client
- `app/page.js` -- après la boucle de génération réussie (Story 1.4, fin de `handleConfirm`), boucler N appels `/api/score` avec `{output: runs[i], criteria: criteriaList}` ; stocker le résultat (nouvel état, jamais rendu) ; échec → même abandon complet que Story 1.4 (vider `runs`, message d'erreur précis)
- `app/api/execute/route.js`, `app/api/extract-criteria/route.js` -- ne pas modifier

## Tasks & Acceptance

**Execution:**
- [x] `app/api/score/route.js` -- constante `FIXED_CRITERIA`, concaténation côté serveur avant l'appel Anthropic, ajustement de la validation de longueur des verdicts -- FR2b
- [x] `app/page.js` -- boucle de notation après génération réussie : appel `/api/score` par réponse, nouvel état `scoreResults` (jamais affiché dans le JSX) -- FR4
- [x] `app/page.js` -- abandon complet si une notation échoue : vide `runs` et `scoreResults`, affiche un message précisant quelle notation a échoué -- NFR4

**Acceptance Criteria:**
- Given les N réponses ont été générées avec succès, when la génération se termine, then l'application appelle `/api/score` pour chacune, dans un contexte neuf
- Given un appel `/api/score`, when la requête est construite, then elle ne contient que les critères extraits (édités) — jamais les 3 critères fixes, ajoutés uniquement côté serveur
- Given tous les appels de notation réussissent, when on inspecte l'UI, then aucun score ni verdict par critère n'est visible nulle part
- Given un appel de notation échoue, when l'erreur survient, then tout le flux est abandonné (réponses déjà affichées incluses) et un message précise quelle notation a échoué

## Implementation Notes

- `FIXED_CRITERIA` ajoutée dans `app/api/score/route.js`, concaténée à `criteria` avant l'appel Anthropic et la validation de longueur des verdicts — jamais acceptée en entrée, jamais distinguée dans `results`.
- `handleConfirm` étendu avec une seconde boucle séquentielle (notation) après la boucle de génération, utilisant une copie locale (`generatedRuns`) pour éviter un effet de fermeture obsolète sur l'état asynchrone `runs`. Échec de notation → même abandon complet que Story 1.4.
- Deux corrections apportées avant/pendant la revue (au-delà du strict scope du spec, mais directement causées par cette story) : (1) message de progression affichant "exécution N+1/N" pendant la phase de notation, corrigé avec un message dédié ; (2) `canSend` ne bloquait pas "Envoyer" pendant génération+notation, fenêtre de corruption d'état étendue par cette story — corrigé (`&& !isGenerating`).
- Revue à une lentille (Edge Case Hunter) : 1 correctif appliqué (`canSend`), 1 signalement réfuté (distinguabilité positionnelle des critères fixes, non pertinente puisque jamais affichée).
- Vérification manuelle : inspection réseau confirmant l'injection serveur des critères fixes (8 résultats pour 5 critères envoyés), aucun score visible dans l'UI après succès, abandon complet vérifié sur échec simulé de `/api/score`.

## Spec Change Log

## Review Triage Log

- **patch** — `app/page.js`, `canSend` : n'incluait pas `!isGenerating`, laissant "Envoyer" cliquable pendant la génération/notation en cours. Vérifié : confirmé, un clic pendant ce laps de temps relance `handleSend` (remise à zéro de `criteriaList`/`extractedCriteria`) pendant qu'un `handleConfirm` précédent tourne encore en arrière-plan, corrompant potentiellement l'état (`runs`/`scoreResults` écrasés par des données obsolètes). Faille pré-existante depuis la Story 1.4, mais nettement plus exposée ici : la fenêtre vulnérable s'allonge de la boucle de génération seule à génération + notation. Fix trivial (`&& !isGenerating`). (Edge Case Hunter)
- **false** — "Les critères fixes, toujours ajoutés en dernier, restent positionnellement distinguables malgré la consigne 'jamais distingués'." Réfuté : la consigne (`AD-2b`, spec) vise à empêcher leur affichage dans l'UI et leur envoi depuis le client — jamais atteint par cette story, `results`/`scoreResults` n'étant lu ni affiché nulle part. Qu'un observateur inspectant le réseau puisse déduire leur nombre par soustraction n'est pas le risque que la consigne visait à couvrir. (Edge Case Hunter, claims check)
- **corrigé pendant l'implémentation (hors revue)** — `isGenerating` couvre désormais aussi la boucle de notation, mais le texte de progression restait "exécution N+1/N" (ex. "6/5") pendant cette phase. Détecté lors de ma propre vérification du diff avant la revue ; corrigé directement (message "notation des réponses en cours…" distinct pendant la phase de notation).

## Verification

**Commands:**
- `npm run build` -- expected: build réussit sans erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- `npm run dev`, générer 2-3 réponses réelles, vérifier dans l'onglet Réseau que chaque requête `/api/score` ne contient que les critères extraits (pas les critères fixes) et qu'aucun score n'apparaît à l'écran
- Simuler un échec de notation (patcher `fetch` sur `/api/score`) et vérifier l'abandon complet (réponses déjà affichées disparaissent, message d'erreur précis)
