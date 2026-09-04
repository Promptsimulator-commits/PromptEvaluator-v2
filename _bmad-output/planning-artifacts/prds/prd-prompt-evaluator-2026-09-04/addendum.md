# Addendum — Prompt Evaluator

## Source : draft "Prompt Trainer" (C:\Users\LaurentBENEZECH\Prompt-trainer\)

Projet antérieur/parallèle du même auteur, POC pour le skill tree IA (Swood Partners), scope général "bien savoir prompter" (5 niveaux, 9 exercices fixes). Fichiers sources : `CLAUDE.md`, `prd-prompt-trainer.md`, `user-stories-v1.md`.

### Éléments potentiellement réutilisables (patterns de conception)

- **Grille de critères donnée à l'IA comme instrument de jugement**, pas de matching de mots-clés — l'IA juge si le critère est rempli "dans son sens". Directement applicable à la notation par critères d'acceptance de Prompt Evaluator.
- **Feedback détaillé par critère** (✅/❌ + explication du pourquoi), plutôt qu'un score brut seul.
- **Feedback qualitatif sans score pour certains cas** (ex. audit de prompt, cas sans checklist stricte) — pattern potentiellement pertinent pour la fonctionnalité 2 (suggestions d'amélioration), qui est qualitative par nature.
- **Architecture serverless pour appel API LLM** : jamais d'appel direct depuis le navigateur, clé API en variable d'environnement côté fonction serverless (ex. Vercel). Le front envoie prompt + critères à la fonction, qui appelle le LLM et renvoie un JSON structuré.
- **Éthique de simplicité** : privilégier la stack la plus simple, éviter le sur-engineering, avancer par petites étapes validées — principes de travail formulés par l'auteur pour un contexte de "vibecoding" (PM non-développeur assisté par Claude Code).

### Éléments spécifiques au Prompt Trainer, probablement NON réutilisables tels quels pour Prompt Evaluator

- **Catalogue fixe de 9 exercices sur 5 niveaux** avec situation métier, prompt de départ et grille pré-écrits pour chacun — Prompt Evaluator est un outil ouvert (l'utilisateur apporte son propre prompt + ses propres critères), pas un parcours d'exercices curatés. Incompatible tel quel avec le mécanisme "prompt + critères saisis par l'utilisateur".
- **Mécaniques d'exercice variées** (QCM avec pénalité, choix A/B + justification hybride, séquence à 4 écrans) — spécifiques au format "exercice", sans équivalent dans le mécanisme générique de Prompt Evaluator.
- **Formule de score fixe** (1 critère = 2,5/10, jusqu'à 4 critères maximum, paliers fixes) — suppose toujours exactement 4 critères. Prompt Evaluator doit gérer un nombre de critères variable (défini par l'utilisateur) et une moyenne sur N exécutions — la formule doit être généralisée, pas reprise telle quelle.
- **Progression `localStorage` mono-utilisateur, pas de connexion/BDD** — posé comme non-goal explicite du POC Prompt Trainer. Prompt Evaluator vise 30 utilisateurs (cabinet) dès le pilote : au minimum une identification légère est probablement nécessaire (à confirmer avec l'utilisateur), donc ce choix ne se transpose pas automatiquement.
- **Contenu pédagogique des 5 niveaux et objectifs pédagogiques par exercice** — spécifique au skill tree "prompting" général ; le pilote actuel (Prompt Evaluator) est recentré sur la seule skill "Prompting Produit" (contexte métier structuré, templates réutilisables, itération, Projets/Skills, ponctuel vs réutilisable) — recouvre en fait presque mot pour mot le contenu déjà noté comme "Niveau 2 — Structurer un prompt" dans le draft Prompt Trainer.
- **Contraintes de timeline et de passation** ("départ dans une semaine", validation d'un responsable pour la suite) — propres au contexte du projet Prompt Trainer, sans lien établi avec le calendrier de Prompt Evaluator.

### Relation avec Prompt Trainer — résolue

Le contenu de skill "Prompting Produit" fourni pour Prompt Evaluator correspond quasiment exactement au contenu déjà défini comme "Niveau 2 — Structurer un prompt" dans le skill tree du draft Prompt Trainer. **Décision tranchée** : Prompt Evaluator **remplace** le mécanisme d'exercices curatés du Prompt Trainer pour cette skill (voir `prd.md` § Problem Statement). La piste de coexistence avec des exercices guidés a été considérée puis mise de côté pour ce pilote (voir Future Considerations de `prd.md`).
