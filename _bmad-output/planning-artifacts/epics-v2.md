---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories]
inputDocuments: ['_bmad-output/planning-artifacts/prds/prd-prompt-evaluator-2026-09-04/prd-v2.md', '_bmad-output/planning-artifacts/architecture/architecture-prompt-evaluator-2026-09-04/ARCHITECTURE-SPINE-v2.md']
---

# Prompt Evaluator - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Prompt Evaluator (POC, 3 jours), decomposing the requirements from the PRD and the Architecture Spine into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: L'utilisateur saisit un prompt (texte libre).
FR2: L'utilisateur saisit des critères d'acceptance (un par ligne, texte libre) — au moins 1 critère non vide est requis pour lancer une évaluation.
FR3: Le prompt est exécuté N fois via l'API Anthropic (Claude Haiku), chaque exécution dans un contexte neuf indépendant.
FR3b: L'utilisateur choisit N avant de lancer l'évaluation, via un curseur allant de 1 à 10 exécutions (défaut : 5). N est figé au lancement.
FR4: Chaque résultat d'exécution est noté par un appel API séparé (contexte neuf), qui évalue chaque critère comme validé ou non, avec une explication.
FR5: Le score d'une exécution = (critères validés / total des critères) × 10.
FR6: La note finale du prompt = moyenne des N scores d'exécution.
FR7: L'utilisateur voit : la moyenne globale, le score de chacune des N exécutions, et pour chaque critère le nombre de fois où il a été validé sur N.
FR8: L'utilisateur peut demander une analyse de son prompt à tout moment (avant ou après une évaluation), via un appel API séparé (contexte neuf).
FR9: L'analyse évalue le prompt sur 4 dimensions : persona, objectif, contraintes, exemples — chacune qualifiée présente / claire / absente, avec une explication et un exemple concret d'amélioration.
FR10: Quand des résultats d'évaluation (Fonctionnalité 1) existent pour ce prompt, l'analyse les intègre et pointe les critères instables identifiés — un critère est dit **instable** s'il a été validé entre 1 et N−1 fois sur N. À N = 1, aucun critère ne peut être qualifié d'instable.
FR11: Les appels à l'API Anthropic passent par une fonction serverless (route API Next.js) — la clé API n'est jamais exposée côté client.

### NonFunctional Requirements

NFR1 (Sécurité) : La clé API Anthropic n'est jamais exposée côté client — lue uniquement via `process.env` dans les routes API serveur (voir Architecture Spine AD-1).
NFR2 (Coût) : Le budget d'appels API reste dans une fourchette indicative de ~10-20€ pour l'ensemble du POC.
NFR3 (Fiabilité) : L'application fonctionne sans bug lors de la démo au responsable — critère de succès du PRD.
NFR4 (Intégrité de la mesure) : Les N exécutions et leurs notations sont indépendantes (aucun contexte de conversation partagé entre appels) ; un échec sur une seule exécution/notation invalide l'ensemble de l'évaluation plutôt que de produire une moyenne partielle (voir Architecture Spine AD-3, AD-4).

### Additional Requirements

- **Pas de starter template externe** — projet Next.js 16.3 (App Router) initialisé from scratch (`create-next-app`) ; à traiter en Epic 1 Story 1.
- **Repo & déploiement** : aucun repo GitHub ni compte GitHub n'existe à ce jour — à créer en tout début de développement, avec déploiement Vercel connecté au repo (un seul environnement, pas de staging).
- **Variable d'environnement** : `ANTHROPIC_API_KEY` déclarée côté Vercel (et en local via `.env.local`, non commité).
- **Contrat des 3 routes API** (Architecture Spine AD-2) :
  - `POST /api/execute` : `{ prompt }` → `{ output }`
  - `POST /api/score` : `{ output, criteria[] }` → `{ results: [{criterion, passed, explanation}] }`
  - `POST /api/analyze` : `{ prompt, runResults? }` → `{ dimensions: [{name, status, explanation, example}] }`
  - Erreurs uniformes sur les 3 routes : `{ error }` + HTTP 500.
- **Orchestration client** : la boucle des N exécutions est pilotée côté client (`app/page.tsx`), pas par une route serveur agrégatrice (Architecture Spine AD-4). N est choisi par l'utilisateur (curseur 1-10, défaut 5) et figé au lancement ; les routes API ignorent N et ne traitent qu'une exécution chacune.
- **État applicatif** : React state local uniquement (`useState`), aucune persistance, aucun `localStorage`, aucune base de données (Architecture Spine AD-5, non-goal PRD).
- **Stack fixée** : Next.js 16.3, Node.js ≥ 20.9, Tailwind CSS 4.3.3, `@anthropic-ai/sdk` 0.123.0, modèle Claude Haiku, hébergement Vercel.

### UX Design Requirements

Aucun document UX formel pour ce POC (délai de 3 jours) — non applicable. Le PRD demande une interface "simple et ludique" (P1, Nice-to-Have), sans exigence de charte graphique précise.

### FR Coverage Map

FR1: Epic 1 - Saisie du prompt à tester
FR2: Epic 1 - Saisie des critères d'acceptance
FR3: Epic 1 - N exécutions indépendantes via l'API Anthropic
FR3b: Epic 1 - Curseur de choix du nombre d'exécutions (1 à 10)
FR4: Epic 1 - Notation de chaque exécution par IA
FR5: Epic 1 - Score par exécution
FR6: Epic 1 - Note finale (moyenne des N scores)
FR7: Epic 1 - Affichage détaillé (moyenne, scores, stabilité par critère)
FR8: Epic 2 - Demande d'analyse à tout moment
FR9: Epic 2 - Analyse sur 4 dimensions (persona/objectif/contraintes/exemples)
FR10: Epic 2 - Intégration des résultats d'évaluation dans l'analyse
FR11: Epic 1 - Sécurité de la clé API (fonction serverless)

NFR1 (sécurité), NFR4 (intégrité de la mesure): portés par Epic 1.
NFR2 (budget), NFR3 (fiabilité démo): transverses, suivis pendant le build, non rattachés à un epic spécifique.

## Epic List

### Epic 1: Évaluer un prompt par exécutions multiples
L'utilisateur peut saisir un prompt et ses critères d'acceptance, lancer N exécutions notées (N réglable de 1 à 10), et voir un score fiable (moyenne + détail par exécution + stabilité par critère). Inclut la mise en place du projet (repo GitHub, Next.js, déploiement Vercel) comme première story.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR11

### Epic 2: Analyser un prompt et recevoir des suggestions
L'utilisateur peut, à tout moment, demander une analyse de son prompt sur les 4 dimensions (persona/objectif/contraintes/exemples), enrichie des résultats d'évaluation quand ils existent.
**FRs covered:** FR8, FR9, FR10

## Epic 1: Évaluer un prompt par exécutions multiples

L'utilisateur peut saisir un prompt et ses critères d'acceptance, lancer N exécutions notées (N réglable de 1 à 10), et voir un score fiable (moyenne + détail par exécution + stabilité par critère).

### Story 1.1: Initialiser et déployer le projet

As a PM qui va démontrer l'outil,
I want un squelette d'application Next.js déployé et accessible en ligne,
So that je peux itérer dessus et montrer une URL fonctionnelle dès le premier jour.

**Acceptance Criteria:**

**Given** aucun repo ni projet n'existe encore
**When** le projet est initialisé
**Then** un repo GitHub existe, un projet Next.js 16.3 (App Router) + Tailwind CSS y est scaffoldé, et il est déployé sur Vercel avec `ANTHROPIC_API_KEY` en variable d'environnement (jamais commitée)
**And** la page d'accueil se charge sans erreur sur l'URL Vercel

### Story 1.2: Saisir un prompt et ses critères d'acceptance

As a consultant,
I want écrire mon prompt et mes critères d'acceptance sur un même écran,
So that je peux préparer un test avant de le lancer.

**Acceptance Criteria:**

**Given** je suis sur la page principale
**When** je saisis un texte dans le champ prompt et un ou plusieurs critères (un par ligne) dans le champ critères
**Then** les deux champs conservent mon texte tel quel (FR1, FR2), et un bouton "Évaluer" devient actif seulement quand le prompt est non vide et qu'au moins 1 ligne de critère non vide est présente (les lignes vides sont ignorées lors du comptage)

### Story 1.3: Exécuter le prompt N fois de façon sécurisée

As a consultant,
I want choisir combien de fois mon prompt est exécuté par l'IA, et voir ces exécutions,
So that je peux observer si les résultats varient d'une fois à l'autre, en ajustant l'effort au besoin.

**Acceptance Criteria:**

**Given** j'ai saisi un prompt, réglé le curseur d'exécutions (1 à 10, défaut 5) et cliqué sur "Évaluer"
**When** l'application appelle `/api/execute` N fois, chaque appel dans un contexte neuf indépendant (FR3, FR3b)
**Then** les N résultats bruts s'affichent à l'écran au fur et à mesure
**And** le curseur est désactivé pendant l'évaluation, et la valeur de N utilisée reste celle du lancement
**And** l'appel à l'API Anthropic se fait exclusivement côté serveur, la clé n'est jamais visible dans le réseau ou le code client (FR11)
**And** si un seul des N appels échoue, l'évaluation entière est abandonnée et une erreur claire est affichée — aucun résultat partiel n'est présenté comme final

### Story 1.4: Noter chaque résultat selon les critères

As a consultant,
I want que chaque résultat obtenu soit noté selon mes critères,
So that je sache lesquels sont remplis ou non, et pourquoi.

**Acceptance Criteria:**

**Given** les N exécutions ont produit un résultat chacune
**When** l'application appelle `/api/score` pour chacun des N résultats (contexte neuf, FR4)
**Then** pour chaque résultat, chaque critère est marqué validé/non validé avec une explication
**And** le score de ce résultat = (critères validés / total des critères) × 10 (FR5)

### Story 1.5: Voir le score moyen et la stabilité par critère

As a consultant,
I want voir la note finale de mon prompt et la fiabilité de chaque critère,
So that je comprenne si mon prompt est globalement bon et où il est instable.

**Acceptance Criteria:**

**Given** les N exécutions sont notées
**When** les résultats sont affichés
**Then** la note finale = moyenne des N scores est affichée (FR6)
**And** le score de chacune des N exécutions est visible individuellement
**And** pour chaque critère, le nombre de fois où il a été validé sur N est affiché (FR7)

## Epic 2: Analyser un prompt et recevoir des suggestions

L'utilisateur peut, à tout moment, demander une analyse de son prompt sur les 4 dimensions (persona/objectif/contraintes/exemples), enrichie des résultats d'évaluation quand ils existent.

### Story 2.1: Demander une analyse structurée du prompt

As a consultant,
I want demander à tout moment une analyse de mon prompt sur les dimensions clés du métier,
So that je comprenne ce qui manque avant même de lancer une évaluation.

**Acceptance Criteria:**

**Given** j'ai saisi un prompt (avec ou sans évaluation préalable)
**When** je clique sur "Analyser"
**Then** l'application appelle `/api/analyze` (contexte neuf, FR8), qui évalue le prompt sur 4 dimensions : persona, objectif, contraintes, exemples
**And** chaque dimension affiche un statut (présente/claire/absente), une explication et un exemple concret d'amélioration (FR9)

### Story 2.2: Enrichir l'analyse avec les résultats d'évaluation existants

As a consultant,
I want que l'analyse tienne compte de mes résultats d'évaluation quand ils existent,
So that les suggestions soient reliées à ce que j'ai réellement observé, pas seulement à la structure du texte.

**Acceptance Criteria:**

**Given** une évaluation (Epic 1) a déjà été lancée pour ce prompt
**When** je demande une analyse
**Then** les résultats d'évaluation (scores par critère, stabilité) sont transmis à `/api/analyze` (FR10)
**And** l'analyse mentionne explicitement les critères instables identifiés (validés entre 1 et N−1 fois sur N), en cohérence avec les résultats affichés en Epic 1
**And** si aucune évaluation n'a encore été lancée, l'analyse fonctionne quand même (Story 2.1), sans ce complément
