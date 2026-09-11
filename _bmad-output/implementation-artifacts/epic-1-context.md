# Epic 1 Context: Envoyer un prompt — extraction des critères et génération de N réponses

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

L'utilisateur saisit un prompt et clique sur un unique bouton "Envoyer" qui déclenche tout le flux : une IA extrait automatiquement les exigences vérifiables du texte (plus de critères tapés à la main), l'utilisateur relit et ajuste cette liste avant de confirmer, puis le prompt est exécuté N fois de façon indépendante et les réponses générées s'affichent en texte brut. Chaque réponse est aussi notée en arrière-plan (jamais affiché individuellement) pour alimenter la mesure de divergence utilisée par l'Épic 2. Cet épic remplace l'ancien Épic 1 "critères manuels" issu de la mécanique V1, retirée lors du pivot du 2026-09-11 ; il porte l'essentiel de la valeur du POC (autonomie de l'extraction, sécurité de la clé API, fiabilité du flux) et inclut la Story 1.1 (infrastructure), déjà faite avant le pivot et inchangée.

## Stories

- Story 1.1: Initialiser et déployer le projet (déjà faite, inchangée par le pivot)
- Story 1.2: Saisir un prompt et lancer l'extraction automatique de critères
- Story 1.3: Réviser et valider la liste de critères extraits
- Story 1.4: Générer N réponses de façon sécurisée
- Story 1.5: Noter chaque réponse en arrière-plan pour mesurer la divergence

## Requirements & Constraints

- Un seul bouton d'action ("Envoyer") lance tout le flux ; il n'y a plus de champ "critères" saisi manuellement.
- L'extraction des critères se fait via un appel API séparé, dans un contexte neuf (pas d'historique de conversation).
- Les critères extraits sont présentés dans une liste éditable (ajout, suppression, édition en place) avant tout lancement de génération ; l'utilisateur confirme ("Confirmer et lancer") ou annule ("Annuler", retour à l'état initial, prompt non modifié).
- 3 critères de base (orthographe/grammaire, cohérence interne, même langue que le prompt) sont toujours appliqués en plus des critères extraits, mais ne sont jamais saisis, ni affichés, ni éditables, ni transmis au client sous quelque forme que ce soit.
- N (nombre d'exécutions) est choisi par un curseur 1-10, défaut 5, figé au moment du lancement ; désactivé pendant la génération.
- Chaque exécution et chaque notation se fait dans un contexte neuf et indépendant — aucun état conversationnel partagé entre appels.
- Les réponses générées s'affichent en texte brut au fur et à mesure, sans score ni tableau de conformité par réponse.
- La notation par critère de chaque réponse (fixe + extrait) n'est jamais affichée dans l'UI ; elle sert uniquement à calculer la divergence consommée par l'Épic 2 (notation par dimension).
- Si un seul appel échoue à n'importe quelle étape (extraction, une des N exécutions, une des N notations), tout le flux est abandonné et une erreur claire est affichée — jamais de résultat partiel présenté comme final.
- La clé API Anthropic n'est jamais exposée côté client ; tout appel LLM passe par une route serverless Next.js.
- Budget API indicatif ~10-20€ pour l'ensemble du POC ; l'appel d'extraction ajoute un appel léger par envoi, sans changer l'ordre de grandeur.
- L'application doit fonctionner sans bug lors de la démo (critère de succès du POC).

## Technical Decisions

- Architecture client/serveur en un seul projet Next.js App Router : `app/` = composants client (aucun appel LLM direct) ; `app/api/*/route.ts` = seule couche autorisée à appeler l'API Anthropic via `@anthropic-ai/sdk`, `ANTHROPIC_API_KEY` lu uniquement via `process.env` côté serveur.
- Routes concernées par cet épic :
  - `POST /api/extract-criteria` (nouvelle) : `{ prompt }` → `{ criteria: string[] }` — n'extrait que les exigences vérifiables du texte, ne renvoie jamais les 3 critères fixes.
  - `POST /api/execute` : `{ prompt }` → `{ output }` (inchangée).
  - `POST /api/score` : `{ output, criteria[] }` → `{ results: [{criterion, passed, explanation}] }` — les 3 critères fixes sont une constante définie uniquement côté serveur dans cette route (ou un module serveur importé par elle), concaténés aux critères reçus avant l'appel Anthropic ; jamais acceptés en entrée, jamais distingués dans la réponse.
  - Erreurs uniformes sur toutes les routes : `{ error }` + HTTP 500.
- Orchestration du flux entièrement côté client (`app/page.tsx`), pas de route serveur agrégatrice, en phases séquentielles : (1) extraction → attente de validation utilisateur, (2) N appels `/api/execute`, (3) N appels `/api/score` (tous les N exécutions doivent être produites avant que la notation ne commence — pas d'entrelacement). La phase suivante de l'épic 2 (analyse par dimension) démarre automatiquement dès la fin de la phase 3.
- Chaque appel Anthropic (extraction, exécution, notation) est un message unique sans historique joint — un appel = un contexte neuf ; aucun état conversationnel conservé côté serveur entre deux appels.
- État applicatif 100% client, en mémoire (`useState`/`useReducer`) ; aucune persistance, aucun `localStorage`, aucune base de données.
- Conventions : routes API en kebab-case sous `app/api/<verbe>/route.ts` ; composants React en PascalCase ; JSON uniquement en entrée/sortie ; couleurs via tokens CSS (`app/globals.css`), jamais en dur.
- Stack figée : Next.js 16.3, Node.js ≥ 20.9, Tailwind CSS 4.3.3, `@anthropic-ai/sdk` 0.123.0, modèle Claude Haiku, hébergement Vercel (déploiement manuel via `vercel --prod`, pas de connexion GitHub↔Vercel automatique, pas de staging).

## UX & Interaction Patterns

- Écran unique, une seule colonne `<main>`, pas de routing ; chaque "surface" (saisie, revue des critères, réponses) est la même colonne qui se redessine en place.
- Bouton "Envoyer" : désactivé tant que le champ prompt est vide ; au clic, lance l'extraction (état de chargement `aria-live="polite"`, "extraction des critères…"), puis ouvre la liste de critères inline sous le prompt — ne génère rien tant que la liste n'est pas confirmée.
- Liste de critères extraits : une seule liste, sans regroupement visuel (les critères fixes n'apparaissent jamais) ; chaque ligne éditable en place, supprimable ; affordance "+ Ajouter un critère" ; un chip mono-espacé accent affiche le compte, mis à jour en direct ("0 critère" au singulier, pluriel sinon).
- "Confirmer et lancer" (style secondaire outlined) : désactivé si la liste est vide ; démarre la génération avec la liste (possiblement éditée).
- "Annuler" (style ghost/texte, contrôle le plus discret) : referme la liste, retour à l'état de saisie initial, prompt non modifié, aucune génération lancée.
- Curseur N (1-10, défaut 5) : toujours accompagné d'un texte d'aide visible en permanence (jamais un tooltip) expliquant le compromis précision/coût ; message explicite spécifique à N=1 ("tu verras un résultat, mais pas la stabilité du prompt").
- Pendant la génération : `aria-live="polite"` progressif ("exécution 2/5", puis "notation des dimensions…") ; curseur désactivé.
- En cas d'échec : panneau `role="alert"` avec message précis (quel appel a échoué, à quelle étape).
- Vue "Réponses générées" (texte brut, sans score par réponse) : vue par défaut une fois les résultats prêts.
- Contrôles désactivés : état visuel + attribut natif `disabled` ; focus visible en permanence sur tous les éléments interactifs.

## Cross-Story Dependencies

- Story 1.3 dépend du résultat de l'extraction (Story 1.2) et doit produire la liste (possiblement éditée) que consomment les Stories 1.4 et 1.5.
- Story 1.4 (N exécutions) doit être terminée pour toutes les réponses avant que la Story 1.5 (notation en arrière-plan) ne commence — pas d'entrelacement exécution/notation.
- La sortie de la Story 1.5 (résultats de notation par réponse, non affichés) est un intrant direct de l'Épic 2 (notation par dimension et correction comportementale) : sans elle, les dimensions Objectif/Contexte/Contraintes ne peuvent pas être corrigées par divergence.
- Story 1.1 est un prérequis d'infrastructure pour toutes les autres stories de l'épic mais ne nécessite aucun travail supplémentaire.
