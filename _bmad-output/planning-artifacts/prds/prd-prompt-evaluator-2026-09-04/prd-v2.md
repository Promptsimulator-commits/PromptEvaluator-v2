---
title: Prompt Evaluator
status: final
created: 2026-09-04
updated: 2026-09-11 (v6 — pivot mécanique V2 : extraction automatique des critères, notation par 3 dimensions Objectif/Contexte/Contraintes avec correction comportementale, plus de flux "Analyser" séparé — voir `_bmad-output/implementation-artifacts/session-log-2026-09-11-v2-design.md` et `sprint-change-proposal-2026-09-11.md`)
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
- Rester dans un budget d'appels API négligeable pour ce POC (~10-20€). Depuis que N est réglable jusqu'à 10 (FR3b), une évaluation peut coûter jusqu'à deux fois le coût initialement prévu à N = 5 : le plafond reste tenable pour un POC démontré sur un poste, mais se consomme d'autant plus vite que N est élevé.

## Non-Goals

- Connexion / authentification — aucun login pour ce POC. L'application est déployée sur une URL Vercel publique, accessible à quiconque a le lien, sans compte à créer. Un SSO ou une authentification pourra être envisagé plus tard si le déploiement à l'échelle est validé.
- Base de données / persistance des résultats entre sessions — hors scope POC, confirmé. L'état vit en mémoire le temps de la démo.
- Support multi-fournisseurs LLM — un seul fournisseur (Anthropic) pour ce POC.
- ~~Nombre d'exécutions (N) configurable par l'utilisateur — fixé à 5 pour le POC.~~ **Corrigé (2026-09-11) : incohérence avec FR3b, qui donne bien à l'utilisateur un curseur 1-10 (défaut 5). N est configurable ; seule sa valeur par défaut est fixée à 5.**
- Le module e-learning théorique associé à la skill "Prompting Produit" — chantier séparé, dans une autre application.
- Déploiement aux 30 consultants — objet d'un futur PRD, conditionné à la décision go du responsable.

## User Journey

**UJ-1 — Julie, PM au cabinet, teste un prompt qu'elle utilise dans son travail**

1. Julie arrive sur l'outil et colle un prompt qu'elle utilise réellement (ex. pour rédiger une synthèse d'entretiens).
2. Elle clique sur **Envoyer** — un seul bouton, une seule action. L'outil extrait automatiquement du texte de son prompt les exigences vérifiables (ex. "moins de 160 caractères", "ton professionnel").
3. La liste des critères extraits s'affiche, éditable : elle peut en corriger, en supprimer, ou en ajouter un que l'extraction aurait manqué. Elle règle le nombre d'exécutions (curseur 1 à 10, 5 par défaut) et clique sur **Confirmer et lancer**.
4. Le prompt est exécuté N fois. Julie voit les N réponses générées, puis peut basculer sur la vue **Analyse** : son prompt est noté sur 3 dimensions (Objectif, Contexte, Contraintes), chacune avec une note (0-10) et un palier (Absent / À clarifier / Clair / Très clair). La note de chaque dimension part d'une lecture du texte du prompt seul, puis est corrigée si les réponses générées divergent entre elles sur cet axe.
5. Pour chaque dimension, elle peut déplier le détail : ce qui a été bien fait, ce qui reste à clarifier, une reformulation concrète suggérée — et, si une correction a été appliquée, ce qui concrètement variait entre les réponses (ex. "2 réponses sur 5 dépassaient la longueur demandée").
6. Julie réécrit son prompt à partir de ces pistes, et clique de nouveau sur **Envoyer** pour vérifier objectivement le progrès — la boucle rédiger → envoyer → comprendre → réécrire → renvoyer est le parcours de pratique délibérée que l'outil encourage.

Trois critères de base (absence de faute d'orthographe/grammaire, cohérence interne, même langue que le prompt) sont toujours vérifiés en arrière-plan, mais **jamais affichés** à Julie — ils ne remontent que si une réponse générée y échoue, comme élément de l'explication de la dimension Contraintes.

## Requirements

### Must-Have (P0)

**Fonctionnalité 1 — Extraction des critères et génération multiple**
- FR1 : L'utilisateur saisit un prompt (texte libre).
- FR2 : Au clic sur "Envoyer", une IA extrait du texte du prompt les exigences vérifiables (un appel API séparé, contexte neuf) — plus de champ "critères" saisi à la main.
- FR2a : Les critères extraits sont affichés dans une liste éditable (ajout, suppression, édition) avant que la génération ne soit lancée ; l'utilisateur confirme via "Confirmer et lancer" ou annule via "Annuler" pour revenir au prompt.
- FR2b : 3 critères de base, fixes, non modifiables et **jamais affichés à l'écran**, sont toujours appliqués en plus des critères extraits : absence de faute d'orthographe/grammaire, cohérence interne (pas de contradiction), même langue que le prompt (sauf demande contraire explicite dans le prompt).
- FR3 : Le prompt est exécuté N fois via l'API Anthropic (Claude Haiku), chaque exécution dans un contexte neuf indépendant.
- FR3b : L'utilisateur choisit N avant de lancer la génération, via un curseur allant de 1 à 10 exécutions (valeur par défaut : 5). N est figé au lancement et ne change pas pendant que la génération est en cours.
- FR4 : Chaque réponse générée est notée en arrière-plan par un appel API séparé (contexte neuf) contre l'ensemble des critères (fixes + extraits) — **jamais affiché comme score individuel** ; ce résultat alimente uniquement la mesure de divergence entre réponses (FR9).
- FR7 : L'utilisateur voit les N réponses générées, en texte brut (pas de score ni de tableau de conformité par réponse).

**Fonctionnalité 2 — Notation du prompt par dimension**
- FR9 : Le prompt est noté sur **3 dimensions** — Objectif, Contexte, Contraintes — chacune sur une échelle 0-10 traduite en 4 paliers (0 = Absent, 1-5 = À clarifier, 6-8 = Clair, 9-10 = Très clair). La note de chaque dimension part d'une lecture textuelle du prompt seul, puis est corrigée selon la divergence observée entre les N réponses générées sur cet axe (3 niveaux de correction : faible = -0, modérée = -2, forte = -4 — voir le journal de session §6.4 pour le détail par dimension). Cette notation fait partie du même flux "Envoyer" — ce n'est plus une action séparée ("Analyser" a été retiré comme bouton indépendant).
- FR10 : Pour chaque dimension, un détail dépliable explique ce qui est bien fait, ce qui est à clarifier, propose une reformulation concrète, et — uniquement si une correction a été appliquée — nomme concrètement ce qui variait entre les réponses. À N = 1, aucune comparaison n'est possible : la note reste le signal textuel seul, avec un message explicite à l'utilisateur.

**Technique**
- FR11 : Les appels à l'API Anthropic passent par une fonction serverless — la clé API n'est jamais exposée côté client (voir `addendum.md` pour le pattern d'architecture repris de Prompt Trainer).

> **Retiré du POC (2026-09-11)** — anciens FR5, FR6, FR8 : le score par exécution (critères validés/total × 10), la moyenne des N scores, et l'analyse comme action indépendante n'existent plus dans la mécanique V2. Voir le journal de session pour le raisonnement complet du pivot.

### Nice-to-Have (P1)

- Interface simple et ludique (cohérent avec l'objectif "intuitif et simple d'utilisation"). Identité visuelle alignée sur SwoodQuest (l'app skill tree du cabinet) pour la cohérence de marque : police Fraunces (titres) + Geist/Geist Mono (interface), violet `#851F6B` en accent principal, fond crème, cartes blanches arrondies.

### Future Considerations (P2)

- Déploiement multi-utilisateurs (connexion, 30 consultants) — futur PRD.
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
- **Contrainte technique de départ** (mise à jour) : le repo GitHub (`swoodpartners/PromptEvaluator`, migré depuis un repo personnel initial) et le squelette du projet (Next.js + Tailwind) sont créés et poussés. Déploiement actuellement sur Vercel (fonctionnel, sert la démo) ; **migration prévue vers un VPS OVH** (contrainte cabinet sur les données + volonté de garder la main sur l'infra) — VPS pas encore commandé (achat en attente), migration à faire une fois provisionné. La clé API Anthropic est obtenue et configurée (en local via `.env.local`, en production en variable d'environnement Vercel). Les routes `/api/execute` (Story 1.3) et `/api/score` (Story 1.4) sont construites et déployées. Reste à construire : l'affichage de la note moyenne et de la stabilité par critère (Story 1.5), et `/api/analyze` (Stories 2.1, 2.2). Le déploiement se fait manuellement via le CLI Vercel — la connexion automatique au repo de l'org GitHub n'est pas résolue, un `git push` ne redéploie donc pas le site.
- **Développement** : vibecoding, PM + Claude Code (même approche que Prompt Trainer).
- **Après la démo** : Si go, déployer la solution à l’ensemble des consultants

