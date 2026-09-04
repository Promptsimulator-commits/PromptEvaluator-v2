---
title: Prompt Evaluator
status: final
created: 2026-09-04
updated: 2026-09-04 (v2 — corrections issues de la revue qualité, assomption feedback confirmée)
---

# PRD — Prompt Evaluator

## Problem Statement

Les consultants du cabinet doivent monter en compétence sur le prompting — une compétence identifiée dans le skill tree IA du cabinet, sous la skill "Prompting Produit" (niveau 2). L'apprentissage informel actuel, sans feedback structuré, ne suffit pas ; un module e-learning seul (théorique, traité séparément) ne fait pas *pratiquer*. Il manque un outil qui fasse pratiquer réellement le prompting, avec un retour objectif et pédagogique sur la qualité des prompts écrits.

Ce PRD couvre un **POC réalisé en 3 jours maximum** : une démo à présenter au responsable pour décider du déploiement (ou non) aux 30 consultants du cabinet. Ce n'est pas encore l'outil déployé à l'échelle.

Ce projet **remplace** l'approche précédente ("Prompt Trainer" : parcours à 9 exercices curatés sur 5 niveaux) pour la skill "Prompting Produit" — au profit d'un outil ouvert où l'utilisateur apporte son propre prompt, plutôt qu'un exercice pré-écrit. Certains patterns de conception de Prompt Trainer sont repris (voir `addendum.md`).

## Goals

- Démontrer, via une démo fonctionnelle sans bug, que l'ensemble des spécifications de ce PRD ont été développées.
- Obtenir une décision go/no-go du responsable pour un déploiement aux 30 consultants du cabinet.
- Faire en sorte que l'outil aide réellement à **identifier et comprendre ses erreurs de prompting**, pas seulement à obtenir un prompt réécrit — l'apprentissage prime sur la simple correction.
- Rester dans un budget d'appels API négligeable pour ce POC (~10-20€).

## Non-Goals

- Connexion / authentification — aucun login pour ce POC. L'application est déployée sur une URL Vercel publique, accessible à quiconque a le lien, sans compte à créer. Un SSO ou une authentification pourra être envisagé plus tard si le déploiement à l'échelle est validé.
- Base de données / persistance des résultats entre sessions — hors scope POC, confirmé. L'état vit en mémoire le temps de la démo.
- Support multi-fournisseurs LLM — un seul fournisseur (Anthropic) pour ce POC.
- Nombre d'exécutions (N) configurable par l'utilisateur — fixé à 5 pour le POC.
- Le module e-learning théorique associé à la skill "Prompting Produit" — chantier séparé, dans une autre application.
- Déploiement aux 30 consultants — objet d'un futur PRD, conditionné à la décision go du responsable.

## User Journey

**UJ-1 — Julie, PM au cabinet, teste un prompt qu'elle utilise dans son travail**

1. Julie arrive sur l'outil et colle un prompt qu'elle utilise réellement (ex. pour rédiger une synthèse d'entretiens).
2. Elle écrit ses critères d'acceptance (un par ligne, en langage libre) : ce qu'un bon résultat devrait respecter.
3. Elle lance l'évaluation : le prompt est exécuté 5 fois, chaque résultat noté selon ses critères. Elle voit le score de chaque exécution, la moyenne, et pour chaque critère combien de fois il a été validé sur 5 — ce qui révèle si son prompt est stable ou non.
4. Elle demande l'analyse du prompt (disponible à tout moment, avant ou après l'évaluation) : le prompt est évalué sur 4 dimensions (persona, objectif, contraintes, exemples), chacune notée présente/claire/absente avec explication et exemple concret d'amélioration. Si des résultats d'évaluation existent déjà, l'analyse pointe aussi les critères instables.
5. Julie réécrit son prompt à partir de ces pistes, et relance l'évaluation pour vérifier objectivement le progrès.
6. Le parcours recommandé est évaluation → analyse → réécriture → réévaluation (boucle de pratique délibérée), mais les deux fonctionnalités restent accessibles indépendamment et à tout moment — Julie peut choisir de commencer par l'analyse si elle préfère.

## Requirements

### Must-Have (P0)

**Fonctionnalité 1 — Évaluation par exécutions multiples**
- FR1 : L'utilisateur saisit un prompt (texte libre).
- FR2 : L'utilisateur saisit des critères d'acceptance (un par ligne, texte libre) — au moins 1 critère non vide est requis pour lancer une évaluation.
- FR3 : Le prompt est exécuté 5 fois via l'API Anthropic (Claude Haiku), chaque exécution dans un contexte neuf indépendant.
- FR4 : Chaque résultat d'exécution est noté par un appel API séparé (contexte neuf), qui évalue chaque critère comme validé ou non, avec une explication.
- FR5 : Le score d'une exécution = (critères validés / total des critères) × 10.
- FR6 : La note finale du prompt = moyenne des 5 scores d'exécution.
- FR7 : L'utilisateur voit : la moyenne globale, le score de chacune des 5 exécutions, et pour chaque critère le nombre de fois où il a été validé sur 5.

**Fonctionnalité 2 — Analyse et suggestions d'amélioration**
- FR8 : L'utilisateur peut demander une analyse de son prompt à tout moment (avant ou après une évaluation), via un appel API séparé (contexte neuf).
- FR9 : L'analyse évalue le prompt sur 4 dimensions : persona, objectif, contraintes, exemples — chacune qualifiée présente / claire / absente, avec une explication et un exemple concret d'amélioration.
- FR10 : Quand des résultats d'évaluation (Fonctionnalité 1) existent pour ce prompt, l'analyse les intègre et pointe les critères instables identifiés — un critère est dit **instable** s'il a été validé entre 1 et 4 fois sur 5 (ni jamais, ni systématiquement).

**Technique**
- FR11 : Les appels à l'API Anthropic passent par une fonction serverless — la clé API n'est jamais exposée côté client (voir `addendum.md` pour le pattern d'architecture repris de Prompt Trainer).

### Nice-to-Have (P1)

- Interface simple et ludique (cohérent avec l'objectif "intuitif et simple d'utilisation"), sans exigence de charte graphique précise pour le POC.

### Future Considerations (P2)

- Déploiement multi-utilisateurs (connexion, 30 consultants) — futur PRD.
- Nombre d'exécutions (N) configurable.
- Support multi-fournisseurs LLM.
- Persistance / historique des évaluations entre sessions.
- Choix du modèle "réel" utilisé par les consultants au quotidien (ex. Sonnet plutôt que Haiku) pour refléter fidèlement leurs conditions d'usage.
- Lien avec le module e-learning théorique de la skill "Prompting Produit" (chantier séparé).
- Piste "coexistence" avec des exercices guidés (mise de côté pour ce pilote, voir `addendum.md`).

## Success Metrics

- La démo se déroule sans bug devant le responsable.
- L'ensemble des exigences P0 de ce PRD sont développées et fonctionnelles.
- Feedback qualitatif recueilli (via collecte de feedbacks) auprès de quelques consultants invités à tester l'outil via l'URL Vercel publique, en marge de la démo au responsable — cohérent avec le Non-Goal "pas de connexion/authentification" puisqu'aucun compte n'est requis pour y accéder.
- Décision go/no-go obtenue du responsable pour la suite (déploiement aux 30 consultants).

## Open Questions

- **Modèle réel vs modèle économique** (produit) : Claude Haiku est utilisé pour le POC (coût minimal) — la question de savoir si le modèle d'évaluation doit refléter le modèle réellement utilisé par les consultants au quotidien reste ouverte pour la V1.

## Timeline Considerations

- **Délai** : 3 jours à partir du 2026-09-04, le plus tôt possible.
- **Contrainte technique de départ** : aucun backend, repo, ni clé API en place à ce jour — mise en place à faire en tout début de développement, ce qui réduit d'autant le temps disponible pour les fonctionnalités.
- **Développement** : vibecoding, PM + Claude Code (même approche que Prompt Trainer).
- **Après la démo** : Si go, déployer la solution à l’ensemble des consultants

