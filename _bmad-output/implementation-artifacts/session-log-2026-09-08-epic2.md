# Journal de session — 8 septembre 2026 (épic 2)

Résumé de la session de développement Prompt Evaluator, du lancement de l'épic 2 jusqu'à la fin de la revue/refactorisation du correctif de précision de notation.

## 1. Story 2.1 — Demander une analyse structurée du prompt

- Compilation du contexte d'épic (`epic-2-context.md`) via le workflow `bmad-build`, puis spec court (route `oneshot`) : [spec-2-1-request-structured-prompt-analysis.md](spec-2-1-request-structured-prompt-analysis.md).
- **Revue du spec en party mode** (groupe "Code Review Crew" : sécurité, adversaire, chasseur de cas limites, artisan, pragmatique) avant implémentation. Trois décisions actées :
  1. Le prompt utilisateur est l'entrée la plus exposée de l'outil (contrairement au résultat jugé par `/api/score`) → system prompt de `/api/analyze` renforcé contre l'injection.
  2. Garde-fou sur les 4 dimensions renvoyées par le modèle (enum fixe, exactement 4, sans doublon) — même classe de garde que `/api/score`.
  3. Boutons "Évaluer"/"Analyser" rendus mutuellement exclusifs.
- Implémentation : nouvelle route `POST /api/analyze` (même patron que `/api/execute`/`/api/score`), bouton "Analyser" dans `app/page.js`, indicateur "prompt modifié depuis cette analyse" si l'utilisateur retape le prompt sans relancer.
- **Testé en navigateur** : chemin heureux, **tentative réelle d'injection de prompt** ("ignore les instructions précédentes...") neutralisée avec succès, panne réseau, erreur 500, réponse malformée, prompt long/markdown/caractères spéciaux/HTML, réactivation des boutons, exclusion mutuelle vérifiée via `button.disabled`, aucun appel vers `api.anthropic.com` depuis le navigateur.
- Revue Blind Hunter (subagent) : 4 corrigés (sémantique du statut "clair" inversée, absence de validation de l'enum de statut, absence de lien entre l'analyse affichée et le prompt réellement analysé, absence de retour `aria-live`), 1 différé (plafond de longueur du prompt, déjà connu).
- PR créée et fusionnée par l'utilisateur (manuellement, voir §3).

## 2. Discussion produit — respect précis des instructions (longueur, ton)

- Demande initiale de l'utilisateur : garantir qu'une consigne comme "rédige en 3 pages" soit respectée exactement.
- Clarification technique donnée : une IA n'a aucune notion réelle de "page" ; c'est une limite de capacité, pas un bug de l'app.
- **Dilemme de conception posé et tranché avec l'utilisateur** : corriger la génération (`/api/execute`, l'IA testée) risquerait de masquer artificiellement l'instabilité réelle d'un prompt — contraire au but de l'outil, qui doit révéler cette instabilité, pas la cacher. Décision : corriger uniquement la **notation** (`/api/score`), pas l'exécution.
- Question annexe de l'utilisateur sur le ton (professionnel/formel/poli...) : expliqué qu'il n'existe pas d'équivalent objectif au comptage de mots pour le ton — les IA sont au contraire assez fiables pour juger un registre de langue qualitativement. Pas d'action engagée, faute d'exemple concret d'un mauvais jugement observé (à surveiller par l'utilisateur).
- **Clarification importante donnée à l'utilisateur** sur le fonctionnement de l'app : le prompt et les critères d'acceptance ont des rôles très différents. Le prompt est envoyé à l'IA testée (`/api/execute`) ; les critères ne le sont **jamais** — ils ne servent qu'à noter le résultat après coup (`/api/score`). Une contrainte mise uniquement dans les critères sans être aussi dans le prompt n'est jamais vue par l'IA testée, et échouera presque toujours pour cette raison, pas par manque de fiabilité du prompt.

## 3. Installation de GitHub CLI

- `gh` n'était pas installé sur ce poste (bloquant pour créer des PR automatiquement).
- Installation via `winget` en portée utilisateur (`--scope user`), sans droits admin (l'installation MSI classique échouait, faute d'élévation UAC possible en session non interactive).
- Authentification (`gh auth login --web`) commencée mais abandonnée à la demande de l'utilisateur, qui préfère créer les PR manuellement via le lien GitHub fourni. `gh` reste installé pour un usage futur si l'utilisateur change d'avis.

## 4. Fix — précision de notation des critères de longueur (`/api/score`)

- Spec dédié (hors épic, type `bugfix`) : [spec-fix-score-length-precision.md](spec-fix-score-length-precision.md), avec une matrice de cas de test à la demande explicite de l'utilisateur.
- Implémentation : `/api/score` calcule désormais le nombre de mots et de caractères du résultat en code (pas deviné par l'IA), les fournit au juge comme fait objectif, et une règle système lui dit de s'y fier plutôt que de deviner à l'œil — sans jamais coder en dur une conversion "1 page = X mots" (le juge raisonne lui-même sur l'unité).
- **Testé précisément sur l'exemple donné par l'utilisateur** : 1000 mots → critère validé ; 1001 mots → critère refusé, avec l'explication citant le compte exact. Testé aussi : unité floue ("pages"), plusieurs critères de longueur simultanés, non-régression sur un critère de ton, et un run réel bout-en-bout (840 mots générés, correctement validés contre "1000 mots maximum").
- Mise à jour du [dossier de démo](../planning-artifacts/prds/prd-prompt-evaluator-2026-09-04/demo-dossier.html) pour refléter le changement.

### 4.1 — Première revue de code (`/bmad-code-review`, 4 relecteurs en parallèle)

- 4 corrigés : `charCount` sensible aux paires de substitution UTF-16 (emoji), base incohérente entre `wordCount` (texte "trimmé") et `charCount` (texte brut), phrase du dossier de démo surinterprétant la notation comme "reproductible", code mort (`filter(Boolean)` inatteignable).
- 1 décision soumise à l'utilisateur : le comptage de mots par découpage sur les espaces ne fonctionne pas pour des scripts sans espaces (japonais, chinois...). **Décision de l'utilisateur : ne rien changer**, l'outil n'étant utilisé que par des consultants francophones/anglophones — consigné dans `deferred-work.md`.
- 2 rejetés car vérifiés faux (comptage de lignes fiable sans mesure explicite, confirmé par un test direct ; emplacement du calcul dans le code sans impact réel) et 2 rejetés car leur seul correctif aurait été d'éditer le spec lui-même (règle du workflow).

### 4.2 — Deuxième revue de code, sur la branche de correctifs elle-même

- Nouveau constat : `[...texte].length` (comptage par point de code Unicode) corrige les paires de substitution mais surcompte toujours les caractères composés (drapeaux, emoji famille en séquence ZWJ, diacritiques combinés).
- Corrigé avec `Intl.Segmenter` (comptage par grappe de graphèmes, nativement supporté par Node.js, aucune dépendance ajoutée). Vérifié : famille + drapeau + " Bonjour" → 10 caractères exactement (2 emoji composés + 1 espace + 7 lettres), au lieu de 17 en comptage par point de code.
- 2 autres constats rejetés (l'un confirmé comme une convention volontaire du projet — le libellé `` `false` `` du journal de triage — l'autre vérifié inexistant ailleurs par recherche).

### 4.3 — Refactorisation (`/simplify`, 4 agents en parallèle : réutilisation, simplification, efficacité, altitude)

- Seul l'angle **efficacité** a trouvé des points réels : `Intl.Segmenter` était reconstruit à chaque requête (déplacé au niveau module, construit une seule fois) et `output.trim()` était calculé deux fois pour la même chaîne (réutilisé).
- Les 3 autres angles n'ont rien trouvé à redire — le code était déjà propre après les deux tours de revue précédents.
- Retesté sans régression après la refacto (limite 1000/1001 mots, emoji composés, résultat vide).

## État à la fin de la session

- **Épic 1** : terminé (inchangé depuis la session précédente).
- **Épic 2** : `in-progress`. **Story 2.1 fusionnée sur `main`** (statut `sprint-status.yaml` corrigé de `review` à `done` en fin de session — était resté à `review` après la fusion manuelle). **Story 2.2** (enrichissement par les résultats d'évaluation) : pas commencée.
- **Fix hors épic** (précision de notation des critères de longueur) : fusionné sur `main`, deux tours de revue de code et une passe de refactorisation effectués, tout vérifié dans le navigateur.
- `gh` (GitHub CLI) est maintenant installé (portée utilisateur) mais **non authentifié** — l'utilisateur crée les PR manuellement via le lien GitHub fourni à chaque fois.
- Décision produit à retenir : l'outil corrige la **précision de la mesure**, jamais le comportement de l'IA testée — principe posé explicitement avec l'utilisateur et applicable à toute future demande similaire (ex. le ton, laissé de côté faute de cas concret observé).
