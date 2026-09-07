# Bonnes pratiques de test

**Pourquoi pas de framework de test automatisé (Vitest, Jest…) pour ce POC ?** Décision explicite, pas un oubli : délai de 3 jours, une seule personne qui code (vibecoding), pas de CI. Le temps d'installer et maintenir une suite de tests automatisés serait pris sur le développement des stories restantes. À la place, chaque story est vérifiée **manuellement mais systématiquement**, dans le vrai navigateur, avec des scénarios écrits à l'avance — pas une vérification "à l'œil". Si le projet passe en V1 (30 consultants), l'automatisation redevient pertinente et devra être réévaluée.

## Le format : Gherkin (Given/When/Then)

Chaque story dans [`_bmad-output/planning-artifacts/epics.md`](_bmad-output/planning-artifacts/epics.md) a déjà ses critères d'acceptance au format **Given/When/Then** (Gherkin) — c'est le format standard de ce projet pour spécifier un comportement attendu, et il ne change pas :

```gherkin
Given <l'état de départ>
When <l'action déclenchée>
Then <ce qui doit être vrai>
And <une autre condition>
```

**Règle : le Given/When/Then d'une story n'est qu'un point de départ.** Avant de proposer une PR, on ajoute les scénarios pour les **cas limites** que le Given/When/Then de la story ne couvre pas forcément — c'est la check-list ci-dessous.

## Check-list des cas limites à passer en revue, pour chaque story

Pas besoin d'écrire un scénario pour chaque ligne si elle ne s'applique pas à la story — mais il faut se poser explicitement la question à chaque fois, pour ne pas se fier uniquement au chemin heureux.

**Entrées utilisateur**
- Champ vide / uniquement des espaces.
- Valeur minimale et maximale autorisée (ex. curseur à 1 et à 10).
- Tentative de dépasser la limite (ex. forcer une valeur hors bornes) — doit être bloquée côté interface *et* rester sans effet si l'API ne dépend pas de cette valeur.
- Texte très long, ou contenant des caractères spéciaux / sauts de ligne / markdown.

**Appels API et réseau**
- L'appel réussit (cas nominal).
- L'appel échoue en HTTP 500 (erreur applicative).
- L'appel échoue au niveau réseau (`fetch` qui lève une exception — coupure, timeout).
- La réponse est mal formée (JSON invalide, champ attendu absent).
- Vérifier dans les requêtes réseau qu'aucun appel ne part vers `api.anthropic.com` depuis le navigateur (la clé ne doit jamais y transiter) — uniquement vers nos propres routes `/api/...`.

**État et séquencement**
- Un échec au milieu d'une séquence de plusieurs appels (ex. le 3ᵉ sur 6) : tout est abandonné, rien de partiel n'est affiché comme résultat final (AD-4).
- Les boutons/curseurs se désactivent pendant une action en cours, et se réactivent correctement après un succès **et** après un échec.
- Un rechargement de page en cours d'évaluation ne doit rien laisser d'incohérent (rappel : pas de persistance, AD-5 — tout redémarre à zéro, c'est le comportement attendu).

**Sécurité**
- La clé API n'apparaît dans aucune requête ni réponse visible du navigateur (onglet réseau).
- Aucune route API n'accepte de paramètre qui contournerait la logique métier (ex. un `N` envoyé directement à une route alors que le nombre d'exécutions est purement géré côté client).

## Comment on vérifie, concrètement

On utilise le navigateur (outil `Browser`), pas uniquement la lecture du code :

1. **Chemin heureux** : remplir le formulaire avec des valeurs normales, lancer l'action, lire le résultat affiché à l'écran (`get_page_text` / capture d'écran).
2. **Cas limites d'entrée** : répéter avec les valeurs extrêmes de la check-list ci-dessus.
3. **Simuler un échec réseau/API sans dépenser d'appel réel** : intercepter `window.fetch` en JavaScript dans la page pour faire échouer un appel précis (ex. le 3ᵉ sur 5), puis vérifier le message affiché et l'état des boutons.
4. **Vérifier le réseau** : lister les requêtes réseau et confirmer qu'elles ne vont que vers nos routes internes, jamais vers l'API Anthropic directement.
5. **Consigner le résultat** dans la description de la PR (section "Plan de test" — voir `CONTRIBUTING.md`), pour qu'il reste une trace de ce qui a été vérifié et non pas seulement "ça marche chez moi".

## Exemple concret — Story 1.3 (exécuter le prompt N fois)

Scénarios effectivement exécutés avant la PR, comme référence pour les prochaines stories :

```gherkin
Scénario: Chemin heureux, plusieurs exécutions
  Given un prompt et au moins 1 critère saisis, curseur à 5
  When je clique sur "Évaluer"
  Then les 5 résultats s'affichent progressivement (1, puis 2, puis 3...)
  And le réseau ne montre que des appels vers /api/execute, jamais vers api.anthropic.com

Scénario: Borne basse du curseur
  Given le curseur réglé sur 1
  When je lance l'évaluation
  Then une seule exécution a lieu, et un message signale l'absence de mesure de stabilité

Scénario: Tentative de dépasser la borne haute
  Given le curseur HTML (min=1, max=10)
  When on force sa valeur à 11 par script
  Then la valeur est ramenée à 10, aussi bien dans le DOM que dans l'état affiché

Scénario: Échec en cours de séquence
  Given un curseur à 6, et le 4e appel simulé en échec
  When je lance l'évaluation
  Then les résultats déjà obtenus (1, 2, 3) sont effacés
  And un message "Exécution 4/6 : <erreur>. Évaluation abandonnée..." s'affiche
  And le bouton et le curseur redeviennent actifs

Scénario: Panne réseau plutôt qu'erreur API
  Given un appel fetch qui lève une exception (pas de réponse HTTP du tout)
  When je lance l'évaluation
  Then le même comportement d'abandon s'applique, avec un message adapté
```

Cette liste sert de gabarit : chaque nouvelle story reprend cette structure (chemin heureux, bornes, échec en cours de route, panne réseau, sécurité) et l'adapte à son propre comportement.
