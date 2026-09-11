# Session log — Conception V2 (2026-09-11)

Journal de la conversation qui a mené à la création du dépôt V2 et aux décisions de conception prises jusqu'ici. Objectif : que quiconque reprenne le travail (Claude dans une nouvelle session, ou un humain) comprenne le contexte complet sans avoir à relire l'historique du chat.

**⚠️ Prochaine étape immédiate : contacter Sally (persona UX designer, skill `bmad-agent-ux-designer` puis `bmad-ux`) pour reprendre la conception à partir des 6 points listés dans `_bmad-output/planning-artifacts/points-a-revoir-avec-sally.md`.** Tout le fond mécanique ci-dessous est validé par la PM ; ce qui reste concerne l'écran, l'interaction, et l'explication pédagogique à l'utilisateur.

---

## 1. Point de départ : le problème observé

Sur la V1 (dépôt `swoodpartners/PromptEvaluator`, figé), deux boutons coexistent :
- **Évaluer** : exécute le prompt N fois, note chaque réponse contre des critères d'acceptance tapés à la main par l'utilisateur, affiche une moyenne + stabilité par critère.
- **Analyser** : évalue le texte du prompt lui-même sur 4 dimensions (persona, objectif, contraintes, exemples), qualifiées présent/clair/absent.

**Problème constaté par la PM** : malgré un texte explicatif sous les boutons, les utilisateurs ne comprennent pas la différence entre les deux actions — ni laquelle cliquer en premier.

La PM a proposé une refonte complète plutôt qu'un simple ajustement de copy, et a fourni un document `spec-4-dimensions-prompt-evaluator.md` (copié dans ce dépôt sous `_bmad-output/planning-artifacts/spec-4-dimensions-prompt-evaluator-seed.md`) décrivant une nouvelle mécanique de notation par dimensions (signal textuel + signal comportemental, 4 niveaux de note, point faible affiché séparément).

## 2. Proposition initiale de la PM

- Supprimer le champ "critères d'acceptance".
- Renommer "Évaluer" en "Envoyer" (icône flèche vers le haut) — génère N réponses.
- Garder "Analyser", qui affiche les 4 dimensions avec 4 niveaux (au lieu de 3) et une note chiffrée par dimension.
- Rediscuter quelles 4 dimensions garder/remplacer.

## 3. Mon retour (Claude) sur cette proposition

Points positifs identifiés : renommage "Envoyer" pertinent (registre chat/messagerie) ; fusion de "Persona" dans "Contexte" résout une confusion réelle trouvée par la PM en test manuel (voir §4) ; alignement fort avec le module e-learning de l'entreprise (4 leviers : objectif / contexte / format attendu / à éviter).

Points de vigilance soulevés :
- Supprimer les critères d'acceptance change la nature du produit : on passe de "tester si l'IA respecte MES exigences" à "diagnostiquer si mon prompt suit les bonnes pratiques universelles" — un changement de positionnement, pas un détail.
- Le signal comportemental (variance entre 3 réponses générées) a des angles morts techniques : lien avec le curseur N (1 à 10) non précisé, seuils de correction ("-2 à -4 points selon l'ampleur") trop vagues pour une IA, notation chiffrée sur 10 potentiellement moins stable qu'un jugement catégoriel.
- Combiner signal textuel + comportemental dans une seule note est un vrai algorithme à faire converger, pas juste une consigne en langage naturel.

## 4. Bugs réels trouvés par la PM en testant l'ancienne mécanique (V1)

Prompt de test : *"Je veux que tu me reformules le texte suivant. Ton employé : professionnel et formel. [...] Critères : pas de fautes d'orthographe / ton empoyé = professionnel et formel"* (note : "empoyé" contient une faute volontaire).

1. **Bug de scoring** (déjà corrigé sur V1, PR mergée) : `/api/score` confondait parfois le texte du *critère* lui-même (contenant la faute "empoyé") avec le *résultat* à évaluer, faisant échouer à tort le critère "pas de fautes d'orthographe". Corrigé en ajoutant une règle explicite au prompt système : seul le résultat délimité est jugé, jamais la qualité d'écriture des critères.
2. **Limite du juge IA** (non corrigible, limite acceptée) : une vraie faute de grammaire ("ton diligence" au lieu de "ta diligence", accord de genre) n'a pas été détectée par le juge. Loggé comme limite connue de l'évaluation par IA, pas un bug de code.
3. **Confusion Persona/ton** : lors de l'analyse, "Persona" a été jugé présent car l'IA a lu "ton employé" comme "un employé" (un rôle) plutôt que "la tonalité employée" (un registre). C'est ce qui a motivé la fusion de Persona dans Contexte dans la nouvelle mécanique — la définition floue de "Persona" permettait cette confusion.

## 5. Argument clé de la PM qui a débloqué la conception

> "Si l'utilisateur respecte parfaitement les dimensions de prompt engineering, les critères devraient obligatoirement être mentionnés directement dans le prompt."

Raisonnement validé : on ne peut équitablement juger une réponse que sur ce que le prompt demandait explicitement. Un prompt parfait sur "Contraintes" (format quantifié) contient déjà, dans son propre texte, l'équivalent de ce qu'on aurait tapé comme critère séparé.

**Nuance apportée par Claude, acceptée par la PM** : certains critères sont des standards universels (ex. "pas de fautes d'orthographe") qu'on n'écrit jamais dans un prompt — d'où la nécessité de critères de base toujours appliqués en plus de ce qui est extrait du prompt.

**Deuxième nuance** : un prompt parfait ne garantit pas qu'une génération donnée respecte réellement la contrainte (les LLM restent non-déterministes) — d'où la nécessité de garder une vérification empirique (les réponses générées), mais comme signal correctif de la note, pas comme un score de conformité séparé.

## 6. Décisions validées (mécanique — fond)

### 6.1 Mécanisme d'extraction des critères
- Plus de champ "critères" séparé : au clic sur **"Envoyer"**, une IA extrait du texte du prompt les exigences vérifiables (ex. "moins de 160 caractères").
- **3 critères de base, fixes, toujours appliqués, non modifiables par l'utilisateur** :
  1. Aucune faute d'orthographe ou de grammaire
  2. La réponse est cohérente, sans contradiction interne
  3. La réponse est dans la même langue que le prompt (sauf demande contraire explicite)
- Les critères extraits du prompt, eux, sont **affichés et modifiables** (ajout/suppression/édition) avant validation — "Option B" retenue plutôt qu'une extraction 100% invisible, pour que l'utilisateur garde confiance dans ce qui est vérifié.
- Une fois validé, les réponses sont générées — **elles ne sont jamais notées individuellement** (pas de tableau de conformité par réponse comme en V1). Elles servent uniquement à mesurer la divergence entre elles (signal comportemental, voir §6.3).

### 6.2 Dimensions : 4 → 3
- **"Exemples" est supprimé comme dimension autonome**, intégré dans **Contraintes** comme 3ᵉ axe (avec format/longueur et exclusions) — donner un exemple concret est la façon la plus précise de spécifier un format.
- Motif : la PM n'utilise pas souvent cette dimension en pratique ; elle est aussi la seule absente du module e-learning de l'entreprise.
- **Dimensions finales : Objectif, Contexte, Contraintes.**
- Nouveaux ancrages "Contraintes" (esquisse, à affiner) : 0 = Absent (aucun axe couvert) / 1-5 = À clarifier (un axe mentionné mais vague) / 6-8 = Clair (un axe quantifié précisément OU un exemple concret donné) / 9-10 = Très clair (plusieurs axes combinés, ou un exemple qui verrouille tout le pattern).

### 6.3 Grille note → libellé (ce que la PM appelle "paliers")
Révision de la légende du document de départ (qui avait 0-2 Absent / 3-5 À clarifier / 6-8 Clair / 9-10 Très clair) :

| Note | Libellé |
|---|---|
| **0** | Absent |
| **1–5** | À clarifier |
| **6–8** | Clair |
| **9–10** | Très clair |

Raison du changement : "Absent" doit signifier une absence totale (0 uniquement, pas de tolérance 0-2) ; "À clarifier" absorbe le 1-5 qui en résulte.

### 6.4 Mécanisme de correction par signal comportemental
Note finale de chaque dimension = note textuelle (lecture du prompt seul) **corrigée** selon la divergence observée entre les réponses générées, **avant** d'appliquer la grille §6.3. 3 niveaux de divergence, mêmes points pour toutes les dimensions :

| Divergence | Correction |
|---|---|
| Faible | -0 |
| Modérée | -2 |
| Forte | -4 |

Comment juger le niveau, par dimension :
- **Contraintes** (seule dimension avec des critères précis à vérifier — extraits + critères de base) : taux de réponses en défaut sur au moins un critère → 0% = Faible / 1-33% = Modérée / >33% = Forte.
- **Objectif** (jugement qualitatif) : Faible = même sujet/angle/détail sur toutes les réponses ; Modérée = une réponse s'écarte sur un aspect secondaire ; Forte = plusieurs réponses divergent significativement (angle, sujet, niveau de détail).
- **Contexte** (jugement qualitatif) : Faible = même ton partout ; Modérée = une réponse a un ton sensiblement différent ; Forte = variation large et incohérente du ton.

**Cas N=1** : aucune comparaison possible → pas de correction, note = signal textuel seul, avec un message explicite à l'utilisateur (même principe que le message existant à N=1 en V1).

### 6.5 Exigence pédagogique (validée, détails à voir avec Sally)
La PM insiste : l'outil évalue le prompt (et par conséquent la qualité des réponses) — il doit expliquer à l'utilisateur *ce qui a été bien fait*, *ce qui est améliorable*, avec une **suggestion concrète de reformulation**, dans une logique de progression pédagogique. Le document de départ (§ "Contenu du message associé au point faible") prévoyait déjà cette mécanique pour la dimension la plus faible ; à étendre/adapter aux 3 dimensions finales. La méthode de calcul elle-même (signal textuel + correctif) doit aussi être vulgarisée à l'utilisateur, pas juste le résultat.

## 7. Décision d'infrastructure : deux dépôts séparés

La PM veut que V1 et V2 coexistent, documentées et comparables, pour qu'une future équipe puisse arbitrer. Décision : deux dépôts Git complètement séparés (pas une branche), chacun avec son code, sa documentation, son déploiement Vercel.

**Déjà fait :**
- **V1** (`https://github.com/swoodpartners/PromptEvaluator`) : reste en ligne tel quel sur `https://prompt-evaluator-pi.vercel.app`. Branche `label-v1-docs` (à mergerapprouver) ajoute un bandeau "Version 1 — figée" dans `CLAUDE.md`/`README.md`, et renomme `CONTRIBUTING.md`, `TESTING.md`, `prd.md`, `epics.md`, `ARCHITECTURE-SPINE.md`, `demo-dossier.html` avec un suffixe `-v1` (CLAUDE.md/README.md gardent leur nom exact — chargés automatiquement par nom par Claude Code / GitHub).
- **V2** (`https://github.com/Promptsimulator-commits/PromptEvaluator-v2`) : cloné en local dans `C:\Users\LaurentBENEZECH\Prompt evaluator-v2`, copie complète de l'historique V1 poussée, mêmes renommages avec suffixe `-v2`, bandeau "Version 2 — en développement" dans `CLAUDE.md`/`README.md`. Déployé manuellement sur `https://prompt-evaluator-v2-eight.vercel.app` (projet Vercel `prompt-evaluator-v2`), variable `ANTHROPIC_API_KEY` configurée (même clé que V1, décision PM).
- **Point d'attention** : la connexion GitHub↔Vercel a échoué pour les deux dépôts (l'app Vercel n'a pas accès aux organisations GitHub concernées) — pas de déploiement automatique au push, il faut relancer `vercel --prod` manuellement après chaque merge sur les deux projets, ou configurer la connexion depuis le dashboard Vercel.

## 8. Ce qui reste ouvert

Voir `_bmad-output/planning-artifacts/points-a-revoir-avec-sally.md` — 6 points, tous côté écran/interaction/pédagogie, aucun point de fond mécanique restant en suspens.

## 9. Prochaine étape

Contacter Sally (`bmad-agent-ux-designer` → `bmad-ux`, mode Update puisque ce dépôt n'a pas encore de `DESIGN.md`/`EXPERIENCE.md` propres — à créer en mode Create si absents) pour concevoir l'écran à partir de l'ensemble des décisions ci-dessus.
