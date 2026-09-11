---
title: 'Saisir un prompt et lancer l''extraction automatique de critères'
type: 'feature'
created: '2026-09-11'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '1828935e6d2033f8e58b098ce42c164785b86f65'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** L'écran actuel (mécanique V1) demande à l'utilisateur de taper lui-même ses critères d'acceptance dans un second champ, et propose deux boutons ("Évaluer"/"Analyser") dont la distinction confusait les utilisateurs — c'est ce que la mécanique V2 retire.

**Approche:** Remplacer le champ "critères" et les deux boutons par un unique champ prompt et un unique bouton "Envoyer", qui déclenche un nouvel appel `/api/extract-criteria` (extraction des exigences vérifiables du texte du prompt par l'IA). Cette story couvre uniquement le déclenchement et l'état de chargement/erreur — l'affichage éditable de la liste extraite est Story 1.3 (pas encore construite).

**Note de scope inter-story :** cette story retire l'ancienne UI (Évaluer/Analyser/critères tapés à la main, résultats, analyse) car la mécanique change de fond. L'application restera intentionnellement incomplète (prompt + Envoyer, sans suite visible après l'extraction) jusqu'à ce que les Stories 1.3 à 2.4 soient construites — c'est le comportement attendu d'une reconstruction story par story, pas un bug.

## Boundaries & Constraints

**Always:** un seul champ visible (prompt) et un seul bouton métier ("Envoyer") ; le bouton est désactivé tant que le prompt est vide ou qu'une extraction est en cours ; l'appel à `/api/extract-criteria` est un contexte neuf, sans historique (AD-3) ; la clé API n'est lue que côté serveur (AD-1) ; erreurs au format `{ error }` + HTTP 500 (AD-2).

**Never:** ne pas construire l'écran de validation/édition des critères (Story 1.3) ; ne pas toucher `/api/execute`, `/api/score`, `/api/analyze` (hors scope, stories ultérieures) ; ne pas réintroduire un champ "critères" tapé à la main ; ne pas conserver les boutons "Évaluer"/"Analyser" ni le rendu des anciens résultats/analyse.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Prompt vide | champ prompt vide | bouton "Envoyer" désactivé | N/A |
| Prompt non vide | texte saisi | bouton "Envoyer" actif | N/A |
| Extraction en cours | clic sur "Envoyer" | `aria-live="polite"` affiche "extraction des critères…", champ prompt désactivé | N/A |
| Extraction réussie | `/api/extract-criteria` renvoie `{ criteria: [...] }` | liste brute des critères affichée (placeholder minimal, remplacé par Story 1.3) | N/A |
| Extraction échouée (API/réseau) | erreur serveur ou réseau | aucune liste ne s'affiche | panneau `role="alert"` avec message clair, bouton "Envoyer" réactivé |
| Réponse IA vide/mal formée | `criteria` absent ou vide | traité comme un échec | même panneau d'erreur que ci-dessus |

</frozen-after-approval>

## Code Map

- `app/page.js` -- réécriture : retirer le champ critères, les boutons Évaluer/Analyser, tout l'état et rendu d'évaluation/analyse (isRunning, isAnalyzing, runs, analysis, etc.) ; ne garder que prompt + curseur N (`MIN_RUNS`/`MAX_RUNS`/`DEFAULT_RUNS`, réutilisé tel quel, sert aux stories suivantes) + nouveau flux d'extraction
- `app/api/execute/route.js`, `app/api/score/route.js` -- ne pas modifier (repris par Stories 1.4/1.5)
- `app/api/score/route.js` -- **référence de style** pour le nouveau `app/api/extract-criteria/route.js` (pattern tool-use, schéma strict, gestion d'erreur)
- `lib/anthropic.js` -- réutiliser `MODEL`, `MAX_TOKENS`, `errorResponse`, `hasApiKey`, `describeAnthropicError` sans les dupliquer

## Tasks & Acceptance

**Execution:**
- [x] `app/api/extract-criteria/route.js` -- nouvelle route POST `{ prompt }` → `{ criteria: string[] }`, appel Anthropic via tool-use (schéma strict, une liste de critères courts et vérifiables), mêmes garde-fous que `/api/score` (validation d'entrée, erreurs uniformes) -- FR2, AD-2, AD-3
- [x] `app/page.js` -- remplacer le formulaire par : champ prompt, curseur N (conservé), bouton "Envoyer" ; état `isExtracting`/`extractionError`/`extractedCriteria` ; au succès, afficher la liste brute des critères (`<ul>` simple, sans édition) en attendant Story 1.3 -- FR1, FR2

**Acceptance Criteria:**
- Given le champ prompt est vide, when la page se charge, then le bouton "Envoyer" est désactivé
- Given un prompt non vide, when je clique sur "Envoyer", then l'application appelle `/api/extract-criteria` (contexte neuf) et affiche "extraction des critères…" (`aria-live="polite"`) pendant l'appel
- Given l'appel échoue (erreur serveur ou réseau), when la réponse arrive, then un panneau `role="alert"` affiche un message clair et aucune liste de critères ne s'affiche
- Given l'appel réussit, when `criteria` est un tableau non vide, then la liste s'affiche et "Envoyer" redevient cliquable

## Implementation Notes

- `app/api/extract-criteria/route.js` créée sur le modèle exact de `/api/score/route.js` : tool-use avec schéma strict (`{criteria: string[]}`), contexte neuf (AD-3), erreurs uniformes `{error}`+500 (AD-2). Réponse vide/mal formée traitée comme un échec.
- `app/page.js` réécrit : suppression complète de l'ancien état/rendu Évaluer/Analyser (isRunning, runs, isComplete, isAnalyzing, analysis, etc.) ; conservation du curseur N (`MIN_RUNS`/`MAX_RUNS`/`DEFAULT_RUNS`) pour les stories suivantes, actuellement inutilisé fonctionnellement. Nouveau : bouton unique "Envoyer", indicateur `aria-live="polite"`, panneau d'erreur `role="alert"`, liste brute (`<ul>`) des critères extraits.
- `app/api/execute/route.js` et `app/api/score/route.js` non modifiés, conformément au scope.
- Pas de tests automatisés (décision assumée du projet, voir `TESTING-v2.md`) : chaque ligne de la matrice I/O a été vérifiée manuellement dans le navigateur, y compris un test d'échec réseau simulé (fetch patché pour rejeter) — comportement conforme dans tous les cas.
- Point à surveiller (non bloquant) : le prompt système d'extraction est nouveau, sans convention préexistante à reprendre — un premier test manuel (un prompt de type poème) a produit 5 critères pertinents, mais la qualité de formulation des critères extraits mérite un regard humain une fois testée sur des prompts réels variés.
- `.claude/launch.json` créé localement (gitignored, non commité) pour que `preview_start` cible bien ce worktree V2 plutôt qu'un répertoire V1 voisin — outillage de dev, sans impact sur le code livré.

## Spec Change Log

## Review Triage Log

- **patch** — `app/api/extract-criteria/route.js` : aucun filtre de déduplication côté serveur sur `criteria`, alors que l'ancien code (`[...new Set(...)]`) garantissait l'absence de doublons en dur, pas seulement via une instruction au modèle ("sans doublon" dans `SYSTEM_PROMPT`). Vérifié : confirmé, le nouveau code ne fait que valider forme/non-vacuité, jamais l'unicité. Un doublon renvoyé par le modèle serait affiché deux fois et, plus tard, fausserait un comptage en Story 1.5. Fix trivial (une ligne). (Blind Hunter + Edge Case Hunter, même cause)
- **patch** — `app/page.js`, `handleSend` : pas de garde de ré-entrance (`if (isExtracting) return;`) en tête de fonction — un double-clic ou un second déclenchement avant que React ne committe `disabled` peut lancer deux appels `/api/extract-criteria` concurrents dont l'un écrase arbitrairement l'état de l'autre. Vérifié : confirmé, `setIsExtracting(true)` est asynchrone (state React), aucun garde synchrone n'existe avant le premier `await`. Fix trivial (une ligne). (Edge Case Hunter + Blind Hunter, même cause)
- **defer** — `app/api/extract-criteria/route.js` : aucune vérification de `message.stop_reason === "max_tokens"` avant d'accepter la réponse — une troncature JSON en cours de génération pourrait produire un `tool_use.input` incomplet. Vérifié : confirmé absent, mais `/api/execute` et `/api/score` (non touchées par ce diff) ont le même angle mort — schéma pré-existant du projet, pas une régression de cette story. `MAX_TOKENS` (4096) est par ailleurs généreux pour une liste de critères courts.
- **defer** — `app/api/extract-criteria/route.js` : aucune limite de longueur sur `prompt` avant l'appel Anthropic (seule la vacuité est vérifiée). Vérifié : confirmé, mais identique au comportement pré-existant de `/api/execute`/`/api/score`/`/api/analyze` — déjà loggé dans `deferred-work.md` comme décision de limite à trancher globalement, pas propre à cette story.
- **defer** — Ligne "Réponse IA vide/mal formée" de la matrice I/O : vérifiée par lecture du code (garde présente et correcte), mais jamais réellement déclenchée contre une vraie réponse Anthropic malformée pendant la vérification manuelle (contrairement à l'échec réseau, simulé via un `fetch` patché) — angle mort inhérent à l'absence de framework de test automatisé de ce POC, pas un défaut du code. (Verification Gap Reviewer)
- **false** — "L'ensemble de la fonctionnalité Évaluer/Analyser est supprimé sans indication que c'est intentionnel." Réfuté : le bloc `<frozen-after-approval>` de ce spec (section "Note de scope inter-story") énonce explicitement cette suppression comme un choix assumé de reconstruction story par story. (Blind Hunter)
- **false** — "Aucun texte de remplacement n'explique ce que fait Envoyer." Réfuté : le sous-titre de `app/page.js` ("Rédige un prompt : on en extrait automatiquement les critères…") explique déjà le mécanisme en une phrase — l'ancien texte plus long existait justement pour lever la confusion entre deux boutons, confusion que le nouveau mécanisme à un seul bouton élimine par construction. (Blind Hunter)
- **false** — "Aucun scénario Gherkin/test manuel n'accompagne cette route." Réfuté : la section Implementation Notes de ce spec documente précisément la vérification manuelle ligne par ligne de la matrice I/O, y compris un test d'échec réseau simulé. (Blind Hunter)
- **rejected (low, fix non trivial)** — Curseur "Nombre d'exécutions" conservé mais inerte tant que Stories 1.3/1.4 ne l'utilisent pas. Réel, mais déjà annoncé comme état intermédiaire assumé dans ce spec (Code Map) ; un traitement visuel (désactivation, infobulle) ajouterait de la complexité pour un état transitoire de quelques stories. (Blind Hunter)
- **rejected (low, remplacement prévu)** — Liste des critères extraits sans badge de comptage, contrairement à l'ancien champ critères. Réel, mais le spec qualifie déjà cet affichage de "placeholder minimal, remplacé par Story 1.3" — ajouter un badge maintenant serait un travail jeté à la story suivante. (Blind Hunter)

## Verification

**Commands:**
- `npm run build` -- expected: build réussit sans erreur
- `npm run lint` -- expected: aucune erreur

**Manual checks (if no CLI):**
- Ouvrir l'app en local (`npm run dev`), tester : prompt vide → bouton désactivé ; prompt rempli → "Envoyer" actif → indicateur de chargement → liste de critères ou message d'erreur clair selon le résultat de l'appel
- Vérifier au clavier (tab) que le champ et le bouton restent utilisables sans souris
