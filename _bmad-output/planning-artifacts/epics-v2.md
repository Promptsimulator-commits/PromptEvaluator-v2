---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories]
inputDocuments: ['_bmad-output/planning-artifacts/prds/prd-prompt-evaluator-2026-09-04/prd-v2.md', '_bmad-output/planning-artifacts/architecture/architecture-prompt-evaluator-2026-09-04/ARCHITECTURE-SPINE-v2.md']
updated: 2026-09-11 (pivot mécanique V2 — voir sprint-change-proposal-2026-09-11.md)
---

# Prompt Evaluator - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Prompt Evaluator (POC, mécanique V2), decomposing the requirements from the PRD and the Architecture Spine into implementable stories.

**Note de pivot (2026-09-11)** : cette version remplace intégralement la précédente répartition Épic 1 "Évaluer" / Épic 2 "Analyser" (critères manuels, 4 dimensions), qui portait sur la mécanique V1 désormais retirée. `sprint-status.yaml` doit être réinitialisé en conséquence — les anciennes stories marquées `done` couvrent du code qui sera réécrit, pas les nouvelles stories ci-dessous.

## Requirements Inventory

### Functional Requirements

FR1 : L'utilisateur saisit un prompt (texte libre).
FR2 : Au clic sur "Envoyer", une IA extrait du texte du prompt les exigences vérifiables (appel API séparé, contexte neuf) — plus de champ "critères" saisi à la main.
FR2a : Les critères extraits sont affichés dans une liste éditable (ajout, suppression, édition) avant le lancement de la génération ; confirmation via "Confirmer et lancer" ou retour via "Annuler".
FR2b : 3 critères de base, fixes, non modifiables et jamais affichés à l'écran, toujours appliqués en plus des critères extraits : absence de faute d'orthographe/grammaire, cohérence interne, même langue que le prompt.
FR3 : Le prompt est exécuté N fois via l'API Anthropic (Claude Haiku), chaque exécution dans un contexte neuf indépendant.
FR3b : L'utilisateur choisit N avant de lancer la génération, via un curseur de 1 à 10 exécutions (défaut : 5). N est figé au lancement.
FR4 : Chaque réponse générée est notée en arrière-plan (appel API séparé, contexte neuf) contre l'ensemble des critères (fixes + extraits) — jamais affiché comme score individuel ; alimente uniquement la mesure de divergence (FR9).
FR7 : L'utilisateur voit les N réponses générées, en texte brut (pas de score ni de tableau de conformité par réponse).
FR9 : Le prompt est noté sur 3 dimensions (Objectif, Contexte, Contraintes), chacune 0-10 sur 4 paliers (0 = Absent, 1-5 = À clarifier, 6-8 = Clair, 9-10 = Très clair). Note de départ = lecture textuelle du prompt seul, corrigée selon la divergence entre les N réponses générées sur cet axe (3 niveaux : faible = -0, modérée = -2, forte = -4). Fait partie du même flux "Envoyer" — pas d'action "Analyser" séparée.
FR10 : Pour chaque dimension, un détail dépliable explique ce qui est bien fait, ce qui est à clarifier, propose une reformulation concrète, et — uniquement si une correction a été appliquée — nomme concrètement ce qui variait entre les réponses. À N = 1, pas de comparaison possible : note = signal textuel seul, avec message explicite.
FR11 : Les appels à l'API Anthropic passent par une fonction serverless (route API Next.js) — la clé API n'est jamais exposée côté client.

> **Retirés (2026-09-11)** : anciens FR5 (score par exécution), FR6 (moyenne des N scores), FR8 (analyse comme action indépendante). Voir le journal de session pour le raisonnement du pivot.

### NonFunctional Requirements

NFR1 (Sécurité) : La clé API Anthropic n'est jamais exposée côté client — lue uniquement via `process.env` dans les routes API serveur (voir Architecture Spine AD-1).
NFR2 (Coût) : Le budget d'appels API reste dans une fourchette indicative de ~10-20€ pour l'ensemble du POC. Le pivot ajoute un appel d'extraction par envoi (léger, un seul appel) sans changer l'ordre de grandeur.
NFR3 (Fiabilité) : L'application fonctionne sans bug lors de la démo au responsable — critère de succès du PRD.
NFR4 (Intégrité de la mesure) : Les N exécutions et leurs notations sont indépendantes (aucun contexte de conversation partagé entre appels) ; un échec sur une seule exécution/notation invalide l'ensemble du flux plutôt que de produire un résultat partiel (voir Architecture Spine AD-3, AD-4).

### Additional Requirements

- **Pas de starter template externe** — projet Next.js déjà scaffoldé et déployé (Epic 1 Story 1.1, déjà fait).
- **Repo & déploiement** : repo GitHub existant (`Promptsimulator-commits/PromptEvaluator-v2`), déployé sur Vercel (`prompt-evaluator-v2-eight.vercel.app`) — déploiement manuel via CLI Vercel tant que la connexion GitHub↔Vercel automatique n'est pas résolue.
- **Variable d'environnement** : `ANTHROPIC_API_KEY` déclarée côté Vercel (et en local via `.env.local`, non commité).
- **Contrat des routes API** (voir Architecture Spine, à mettre à jour dans le même chantier — AD-2 révisé) :
  - `POST /api/extract-criteria` *(nouvelle route)* : `{ prompt }` → `{ criteria: string[] }`
  - `POST /api/execute` : `{ prompt }` → `{ output }` *(inchangée)*
  - `POST /api/score` : `{ output, criteria[] }` → `{ results: [{criterion, passed, explanation}] }` — `criteria[]` inclut désormais les 3 critères fixes, ajoutés côté serveur, jamais envoyés par le client
  - `POST /api/analyze-dimensions` *(remplace `/api/analyze`)* : `{ prompt, scoreResults? }` → `{ dimensions: [{name: "objectif"|"contexte"|"contraintes", note, palier, explanation, rewriteSuggestion, correctionApplied, correctionDetail?}] }`
  - Erreurs uniformes sur toutes les routes : `{ error }` + HTTP 500.
- **Orchestration client** : la boucle des N exécutions reste pilotée côté client (`app/page.tsx`). Nouvel enchaînement : extraction → (attente validation utilisateur) → N exécutions → N notations → notation par dimension.
- **État applicatif** : React state local uniquement (`useState`), aucune persistance, aucun `localStorage`, aucune base de données.
- **Stack fixée** : Next.js 16.3, Node.js ≥ 20.9, Tailwind CSS 4.3.3, `@anthropic-ai/sdk` 0.123.0, modèle Claude Haiku, hébergement Vercel.

### UX Design Requirements

`DESIGN.md` et `EXPERIENCE.md` (mis à jour le 2026-09-11, `_bmad-output/planning-artifacts/ux-designs/ux-prompt-evaluator-2026-09-08/`) font foi pour l'écran, l'interaction, et la pédagogie — voir en particulier les mocks `mockups/criteria-validation-panel.html` et `mockups/results-analyse-view.html`.

### FR Coverage Map

FR1 : Epic 1 - Saisie du prompt
FR2, FR2a : Epic 1 - Extraction et validation des critères
FR2b : Epic 1 - Critères de base fixes (invisibles)
FR3, FR3b : Epic 1 - N exécutions, curseur 1-10
FR4 : Epic 1 - Notation en arrière-plan pour la divergence
FR7 : Epic 1 - Affichage des réponses générées
FR9 : Epic 2 - Notation par dimension (signal textuel + correction)
FR10 : Epic 2 - Détail pédagogique dépliable
FR11 : Epic 1 - Sécurité de la clé API (toutes les routes)

NFR1 (sécurité), NFR4 (intégrité de la mesure) : portés par Epic 1.
NFR2 (budget), NFR3 (fiabilité démo) : transverses, suivis pendant le build.

## Epic List

### Epic 1: Envoyer un prompt — extraction des critères et génération de N réponses
L'utilisateur saisit un prompt et clique sur "Envoyer" : les critères sont extraits automatiquement et présentés pour validation, puis N réponses sont générées et affichées. Remplace l'ancien Épic 1 (critères manuels) — inclut la Story 1.1 (infrastructure), déjà faite.
**FRs covered:** FR1, FR2, FR2a, FR2b, FR3, FR3b, FR4, FR7, FR11

### Epic 2: Noter le prompt sur 3 dimensions avec correction comportementale
Une fois les réponses générées, le prompt est noté sur 3 dimensions (Objectif, Contexte, Contraintes) à partir d'une lecture textuelle corrigée par la divergence observée entre les réponses, avec un détail pédagogique dépliable par dimension. Remplace l'ancien Épic 2 (analyse à 4 dimensions, action séparée).
**FRs covered:** FR9, FR10

## Epic 1: Envoyer un prompt — extraction des critères et génération de N réponses

### Story 1.1: Initialiser et déployer le projet

*(Inchangée — déjà faite lors de la mécanique V1 ; l'infrastructure ne change pas avec le pivot.)*

As a PM qui va démontrer l'outil,
I want un squelette d'application Next.js déployé et accessible en ligne,
So that je peux itérer dessus et montrer une URL fonctionnelle dès le premier jour.

**Acceptance Criteria:**

**Given** aucun repo ni projet n'existe encore
**When** le projet est initialisé
**Then** un repo GitHub existe, un projet Next.js (App Router) + Tailwind CSS y est scaffoldé, et il est déployé sur Vercel avec `ANTHROPIC_API_KEY` en variable d'environnement (jamais commitée)
**And** la page d'accueil se charge sans erreur sur l'URL Vercel

### Story 1.2: Saisir un prompt et lancer l'extraction automatique de critères

As a consultant,
I want écrire mon prompt et cliquer sur un seul bouton pour lancer le test,
So that je n'ai pas à deviner quels critères taper moi-même.

**Acceptance Criteria:**

**Given** je suis sur la page principale avec un champ prompt vide
**When** je saisis un texte dans le champ prompt
**Then** le bouton "Envoyer" devient actif dès que le champ est non vide (FR1)

**Given** j'ai saisi un prompt et cliqué sur "Envoyer"
**When** l'application appelle `/api/extract-criteria` avec mon prompt (contexte neuf, FR2)
**Then** un indicateur `aria-live="polite"` affiche "extraction des critères…" pendant l'appel
**And** si l'appel échoue, une erreur claire s'affiche (`role="alert"`) et aucune liste de critères ne s'ouvre

### Story 1.3: Réviser et valider la liste de critères extraits

As a consultant,
I want relire et ajuster les critères que l'outil a repérés dans mon prompt,
So that je garde confiance dans ce qui va être vérifié avant de lancer les tests.

**Acceptance Criteria:**

**Given** l'extraction a renvoyé une liste de critères
**When** la liste s'affiche sous le prompt
**Then** chaque critère est visible dans un champ éditable, avec un bouton de suppression par ligne, et un bouton "+ Ajouter un critère" (FR2a)
**And** un chip affiche le nombre de critères, mis à jour en direct à chaque ajout/suppression/édition
**And** la liste ne contient jamais les 3 critères de base fixes (FR2b) — ils ne sont pas affichés

**Given** la liste de critères est affichée
**When** je clique sur "Confirmer et lancer"
**Then** la génération démarre avec la liste (possiblement éditée) de critères — désactivé si la liste est vide

**Given** la liste de critères est affichée
**When** je clique sur "Annuler"
**Then** la liste se ferme, je reviens au champ prompt (non modifié), et aucune génération n'est lancée

### Story 1.4: Générer N réponses de façon sécurisée

As a consultant,
I want choisir combien de fois mon prompt est exécuté par l'IA, et voir ces réponses,
So that je puisse ensuite comparer leur cohérence.

**Acceptance Criteria:**

**Given** j'ai validé la liste de critères et réglé le curseur d'exécutions (1 à 10, défaut 5)
**When** je clique sur "Confirmer et lancer"
**Then** l'application appelle `/api/execute` N fois, chaque appel dans un contexte neuf indépendant (FR3, FR3b)
**And** les N réponses s'affichent au fur et à mesure dans la vue "Réponses générées" (texte brut, sans score) (FR7)
**And** le curseur est désactivé pendant la génération, et la valeur de N utilisée reste celle du lancement
**And** l'appel à l'API Anthropic se fait exclusivement côté serveur, la clé n'est jamais visible côté client (FR11)
**And** si un seul des N appels échoue, le flux entier est abandonné et une erreur claire est affichée — aucun résultat partiel n'est présenté comme final

### Story 1.5: Noter chaque réponse en arrière-plan pour mesurer la divergence

As a système,
I want noter chaque réponse générée contre l'ensemble des critères (fixes + extraits),
So that la divergence entre réponses puisse corriger la note de chaque dimension (Epic 2), sans jamais exposer de score par réponse à l'utilisateur.

**Acceptance Criteria:**

**Given** les N réponses ont été générées
**When** l'application appelle `/api/score` pour chacune (contexte neuf, FR4)
**Then** chaque appel reçoit la liste de critères extraits (possiblement éditée) **plus** les 3 critères fixes, ajoutés côté serveur — jamais envoyés depuis le client
**And** le résultat (validé/non-validé par critère, par réponse) n'est affiché nulle part dans l'UI — il n'alimente que le calcul de divergence consommé par Epic 2
**And** si une réponse échoue sur un critère fixe, ce fait reste disponible pour l'explication de la dimension Contraintes (Epic 2, Story 2.3), jamais comme ligne séparée

## Epic 2: Noter le prompt sur 3 dimensions avec correction comportementale

### Story 2.1: Calculer et afficher la note par dimension à partir du signal textuel

As a consultant,
I want voir mon prompt noté sur les dimensions clés du métier,
So that je comprenne où mon prompt est clair ou à améliorer, sans avoir à lancer une action séparée.

**Acceptance Criteria:**

**Given** les N réponses ont été générées et notées (Epic 1)
**When** je clique sur "Voir l'analyse" (bascule d'affichage, pas un nouvel appel)
**Then** l'application affiche 3 cartes côte à côte (Objectif, Contexte, Contraintes), chacune avec une note (0-10) et un palier (Absent/À clarifier/Clair/Très clair) (FR9)
**And** ces notes proviennent d'un appel `/api/analyze-dimensions` avec le prompt (contexte neuf), déclenché automatiquement dès que les réponses sont prêtes — pas au clic sur le toggle
**And** les 3 cartes sont traitées de façon identique visuellement — aucune n'est mise en avant comme "point faible"

### Story 2.2: Appliquer la correction comportementale à la note

As a système,
I want corriger la note textuelle de chaque dimension selon la divergence observée entre les réponses générées,
So that une note de départ optimiste soit rattrapée si le prompt s'avère en pratique ambigu.

**Acceptance Criteria:**

**Given** N ≥ 2 réponses ont été générées et notées (Epic 1, Story 1.5)
**When** la note de la dimension Contraintes est calculée
**Then** le taux de réponses en défaut sur au moins un critère détermine la correction : 0% = faible (-0), 1-33% = modérée (-2), >33% = forte (-4)

**Given** N ≥ 2 réponses ont été générées
**When** la note des dimensions Objectif ou Contexte est calculée
**Then** la divergence qualitative entre réponses (sujet/angle/détail pour Objectif ; ton pour Contexte) détermine le même barème de correction (faible/modérée/forte)

**Given** N = 1
**When** une dimension est notée
**Then** aucune correction n'est appliquée — la note est le signal textuel seul, avec un message explicite indiquant qu'aucune comparaison n'a été possible (FR10)

### Story 2.3: Afficher le détail pédagogique dépliable par dimension

As a consultant,
I want comprendre pourquoi ma note a bougé et comment améliorer mon prompt,
So that je progresse réellement, pas seulement que je corrige ce prompt précis.

**Acceptance Criteria:**

**Given** une carte de dimension est affichée (collapsed par défaut)
**When** je clique dessus
**Then** elle se déplie (`aria-expanded`) et affiche : ce qui est bien fait, ce qui est à clarifier, une reformulation concrète suggérée (FR10)

**Given** une correction comportementale a été appliquée à cette dimension (Story 2.2)
**When** le détail est déplié
**Then** une phrase nomme concrètement ce qui variait entre les réponses (ex. "2 réponses sur 5 dépassaient la longueur demandée") — jamais un score brut type "-2 points"

**Given** aucune correction n'a été appliquée (divergence faible, ou N = 1)
**When** le détail est déplié
**Then** aucune section de correction ne s'affiche

### Story 2.4: Basculer entre la vue Réponses et la vue Analyse

As a consultant,
I want passer d'une vue à l'autre sans relancer de calcul,
So that l'écran reste court et lisible à tout moment, même après une génération.

**Acceptance Criteria:**

**Given** les résultats (réponses + analyse par dimension) sont prêts
**When** je clique sur "Voir l'analyse" ou "Voir les réponses"
**Then** l'affichage bascule instantanément entre les deux vues, sans nouvel appel API
**And** seul le libellé de la vue actuellement **inactive** est affiché sur le bouton
**And** la vue "Réponses générées" est celle affichée par défaut juste après la génération
