# Session log — Conception V2 (2026-09-11)

Journal de la conversation qui a mené à la création du dépôt V2 et aux décisions de conception prises jusqu'ici. Objectif : que quiconque reprenne le travail (Claude dans une nouvelle session, ou un humain) comprenne le contexte complet sans avoir à relire l'historique du chat.

**Mise à jour (même journée) : Sally a été contactée, les 6 points ont été tranchés, la documentation du dépôt a été alignée sur le pivot, et le développement (Epic 1 complet + Story 2.1/2.2 de l'Epic 2) a été fait dans la foulée — voir §10 et suivants pour la suite du journal.** Tout le fond mécanique ci-dessous est validé par la PM ; ce qui suit documente l'écran, l'interaction, la pédagogie, puis le build.

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

## 8. Ce qui restait ouvert avant Sally

Voir `_bmad-output/planning-artifacts/points-a-revoir-avec-sally.md` — 6 points, tous côté écran/interaction/pédagogie, aucun point de fond mécanique en suspens à ce stade. Tous tranchés en §10 ci-dessous.

## 9. (obsolète) Prochaine étape prévue à ce moment-là

Contacter Sally (`bmad-agent-ux-designer` → `bmad-ux`) pour concevoir l'écran — fait, voir §10.

---

## 10. Session Sally (UX) — les 6 points tranchés

Repris via `bmad-agent-ux-designer` → `bmad-ux`, mode **Update** (un DESIGN.md/EXPERIENCE.md existait déjà dans le dépôt, hérité de V1, daté 2026-09-08, décrivant encore la mécanique V1 — pas une conception vierge comme supposé en §9). Décisions, dans l'ordre des 6 points :

1. **Explication par dimension** : dépliable au clic sur chaque dimension, pas toujours visible, aucune des 3 dimensions mise en avant comme "point faible" (contrairement au document de départ qui prévoyait ce concept — abandonné).
2. **Paliers** : garder à la fois le chiffre (0-10) et le libellé (Absent/À clarifier/Clair/Très clair) — le chiffre donne la nuance fine, le libellé le sens immédiat.
3. **Critères de base fixes** : décision initiale "deux groupes visuellement séparés" **révisée en cours de session** — finalement **totalement invisibles** à l'écran de validation des critères. S'ils font échouer une réponse, ce n'est mentionné que dans l'explication pédagogique de la dimension Contraintes, jamais comme ligne séparée.
4. **Mise en page à 3 dimensions** : 3 colonnes égales sur une rangée (remplace la grille 2×2 de l'ancienne mécanique à 4 dimensions).
5. **Vulgarisation du calcul en 2 temps** : pas d'explication générique en haut d'écran — l'explication de la correction comportementale apparaît uniquement dans le détail dépliable de la dimension concernée, et seulement quand une correction a réellement eu lieu, avec le détail concret de ce qui variait (ex. "2 réponses sur 5 dépassaient la longueur demandée"), jamais un delta de points brut.
6. **Écran d'extraction/validation** : pas de modale — le formulaire s'ouvre vers le bas sous le prompt (une seule surface, cohérent avec le principe une-seule-page). Bouton "Confirmer et lancer" explicite (distinct du bouton "Envoyer" initial) + bouton "Annuler" qui referme et revient au prompt.

**Point ajouté en cours de session, hors des 6 initiaux** : la proposition de départ gardait implicitement deux boutons métier ("Envoyer" pour générer, "Analyser" pour diagnostiquer). Risque identifié : soit un seul bouton "Envoyer" qui affiche tout sur un écran unique (trop long), soit deux boutons (retombe dans la confusion d'origine). **Solution retenue** : un seul bouton métier "Envoyer" qui déclenche tout le flux, puis une **bascule d'affichage** ("Voir l'analyse" / "Voir les réponses") entre deux vues — pure bascule côté client, jamais un nouvel appel API.

**Livrables** : `DESIGN.md`/`EXPERIENCE.md` mis à jour (`_bmad-output/planning-artifacts/ux-designs/ux-prompt-evaluator-2026-09-08/`), 2 mocks HTML ajoutés (`mockups/criteria-validation-panel.html`, `mockups/results-analyse-view.html`). Un `[ASSUMPTION]` laissé dans `DESIGN.md` sur le traitement visuel du 4ᵉ palier "Très clair" (teinte `primary/30`, plus dense que `primary/15` pour "Clair") — non contredit depuis par l'usage réel en Story 2.1.

## 11. Correction de cap — alignement PRD/epics/architecture/démo (`bmad-correct-course`)

Découverte en cours de session : le PRD (`prd-v2.md`), les epics (`epics-v2.md`) et l'architecture (`ARCHITECTURE-SPINE-v2.md`) portaient le suffixe `-v2` mais leur **contenu était resté celui de la mécanique V1** (critères manuels, 4 dimensions) — seuls le journal de session et les spines UX reflétaient le pivot. Un chantier `bmad-correct-course` complet a réécrit ces trois documents plus le dossier de démo (`demo-dossier-v2.html`) et les bannières `CLAUDE.md`/`README.md`, en mode incrémental (chaque changement approuvé avant application). Détail complet et raisonnement : `_bmad-output/planning-artifacts/sprint-change-proposal-2026-09-11.md`.

Corrections notables faites au passage :
- Incohérence PRD corrigée : un Non-Goal disait "N fixé à 5" alors que FR3b donne un curseur 1-10 à l'utilisateur — contradiction pré-existante, pas liée au pivot.
- `sprint-status.yaml` remis à `backlog` pour toutes les nouvelles stories (les anciennes, marquées `done`, couvraient la mécanique retirée) — seule la Story 1.1 (infrastructure) restait valide telle quelle.

PR fusionnée sur `main` (branche `docs/v2-mechanic-pivot`).

## 12. Développement — Epic 1 (Envoyer un prompt : extraction, génération, notation en arrière-plan)

Process retenu pour chaque story : `bmad-build` (spec → approbation PM → implémentation par sous-agent → vérification du diff → revue → présentation), une branche Git dédiée par story, PR ouverte manuellement (le `gh` CLI n'est pas authentifié dans cet environnement — lien de création de PR donné à chaque fois), titre/description de PR générés automatiquement en anglais, merge fait par la PM puis confirmation en chat pour enchaîner sur la story suivante sans re-demander (préférence explicite, voir mémoire `feedback_pr_workflow_v2`).

- **Story 1.1** (infrastructure) : déjà faite avant le pivot, inchangée.
- **Story 1.2** — Saisir un prompt et lancer l'extraction automatique de critères. Nouvelle route `/api/extract-criteria`. Remplace le champ critères manuel + boutons Évaluer/Analyser par un champ prompt + bouton unique "Envoyer". Revue à 3 lentilles (Blind Hunter, Edge Case Hunter, Verification Gap) — 2 correctifs (déduplication des critères côté serveur, garde anti double-clic).
- **Story 1.3** — Réviser et valider la liste de critères extraits (édition en place, suppression, ajout, chip de comptage, "Confirmer et lancer"/"Annuler"). À partir de cette story, revue réduite à **une seule lentille (Edge Case Hunter)**, décision de coût en tokens prise par la PM (voir §14). 1 correctif (garde contre un critère vide).
- **Story 1.4** — Générer N réponses de façon sécurisée (`/api/execute` en boucle, N figé au clic, affichage progressif, abandon complet sur échec). Aucun correctif nécessaire après revue.
- **Story 1.5** — Noter chaque réponse en arrière-plan (`/api/score` étendu : 3 critères fixes injectés **côté serveur uniquement**, jamais envoyés/affichés). Deux vrais bugs trouvés et corrigés en marge du spec (texte de progression erroné pendant la notation ; bouton "Envoyer" resté cliquable pendant génération+notation, fenêtre de corruption d'état — `canSend` corrigé).

Epic 1 marqué `done` dans `sprint-status.yaml` une fois la Story 1.5 mergée.

## 13. Développement — Epic 2 (Notation par dimension, en cours)

- **Story 2.1** — Calculer et afficher la note par dimension à partir du signal textuel. Nouvelle route `/api/analyze-dimensions` (remplace l'ancienne `/api/analyze` de la mécanique V1, laissée mais non utilisée — dette technique mineure loggée dans `deferred-work.md`). Palier toujours calculé en code à partir de la note, jamais laissé au modèle. Déclenchement automatique dès la fin de la notation (Epic 1), jamais au clic sur la bascule. Bascule Réponses/Analyse + 3 cartes identiques (non dépliables à ce stade).
- **Story 2.2** — Appliquer la correction comportementale à la note. En écrivant cette story, un vrai trou d'architecture a été trouvé : `AD-4b` (ARCHITECTURE-SPINE-v2.md) ne prévoyait d'envoyer que `scoreResults` à la route d'analyse, mais juger la divergence de ton/angle (Objectif, Contexte) nécessite de lire le **texte** des réponses générées, pas seulement les verdicts critère par critère — corrigé en ajoutant `responses` au contrat. Contraintes se calcule en code (déterministe, taux d'échec) ; Objectif/Contexte via un second appel IA qui compare les textes. `correctionApplied` vrai seulement si la correction est non nulle (modérée/forte, jamais "faible"). Un correctif de revue : `maxDuration` de la route doublé (60→120s) car elle fait désormais 2 appels Anthropic séquentiels.

**Restent à faire** (Epic 2) : Story 2.3 (détail pédagogique dépliable par dimension) et Story 2.4 (bascule Réponses/Analyse — déjà largement construite en 2.1, cette story sera surtout une vérification). **Décision de la PM : les fusionner en une seule story/implémentation** pour limiter le coût (voir §14).

## 14. Décision sur le coût en tokens de la revue

En cours de session, la PM a demandé à limiter la dépense de tokens (objectif : construire toute l'app dans l'après-midi) sans sacrifier la qualité. Constat partagé : le poste dominant est le sous-agent d'implémentation (~100-145k tokens/story), pas la revue — passer de 3 lentilles de revue à 1 seule (Edge Case Hunter) économise ~40% du coût de revue (~250k → ~85k) mais ne change rien au poste principal. Décisions prises :
- Revue à une seule lentille (Edge Case Hunter) sur toutes les stories depuis la 1.3.
- Fusionner les stories 2.3 et 2.4 (légères, étroitement liées) en un seul spec/sous-agent/revue plutôt que de payer deux fois les frais fixes.

## 15. Prochaine étape

Écrire et implémenter un spec combiné Story 2.3 + 2.4 (détail pédagogique dépliable + bascule Réponses/Analyse), sur une branche dédiée, revue à une lentille, PR à ouvrir manuellement (lien GitHub, `gh` non authentifié). Une fois mergée, l'Epic 2 — et le POC complet côté mécanique — sera terminé.
