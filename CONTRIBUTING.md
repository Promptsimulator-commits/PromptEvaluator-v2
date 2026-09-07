# Bonnes pratiques de développement

Ce document décrit comment une story avance, du premier commit jusqu'à `main`. Objectif : un code propre, une trace claire de ce qui a été vérifié, et aucune surprise en démo (NFR3 du PRD).

Pour le contexte produit (PRD, architecture, epics/stories), voir [`_bmad-output/planning-artifacts/`](_bmad-output/planning-artifacts/). Pour l'approche de test, voir [`TESTING.md`](TESTING.md).

## Branches

- Une branche par story : `story-<numéro>-<résumé-court>` (ex. `story-1.4-score-criteria`).
- Jamais de commit ni de push direct sur `main` — tout passe par une Pull Request.
- La branche part de `main` à jour.

## Commits

- Message en anglais, à l'impératif, qui explique le **pourquoi** plutôt que le **quoi** (le diff montre déjà le quoi).
- Un commit peut regrouper plusieurs fichiers si c'est un seul changement logique (ex. code + specs mises à jour en cohérence).
- Se termine par la ligne d'attribution demandée par l'environnement (`Co-Authored-By: ...`).

## Pull Requests

Une PR est ouverte vers `main` une fois la story terminée et auto-vérifiée (voir `TESTING.md`). La description de la PR contient :

1. **Quoi** : ce qui change, en une ou deux phrases.
2. **Pourquoi** : quelle story / quel besoin ça couvre.
3. **Plan de test** : les scénarios Gherkin de la story (voir `TESTING.md`) et leur résultat — cochés au fur et à mesure qu'ils ont été vérifiés.
4. **Écarts connus** : toute limite ou compromis assumé (ex. la limite du critère "instable" à N=1, documentée dans le PRD).

### Revue de code

**Cette étape ne s'applique qu'aux PR qui contiennent du code** (`app/`, `package.json`, etc.). Une PR qui ne touche que de la documentation (`.md`) passe directement à la relecture de la PM ci-dessous — faire analyser du texte par un outil de revue de code n'a pas de sens.

Avant que la PM approuve la fusion d'une PR de code, celle-ci passe par le skill **`/bmad-code-review`** (plusieurs relecteurs indépendants en parallèle, puis triage des remarques). Les points de vigilance systématiques pour ce projet :

- **Sécurité (AD-1)** : la clé API n'apparaît dans aucun fichier `"use client"`, n'est jamais renvoyée au client, n'est lue que via `process.env` côté serveur.
- **Contrat des routes (AD-2)** : `{ prompt }` / `{ output }` etc. respectés à la lettre ; erreurs toujours `{ error }` + HTTP 500.
- **Indépendance des appels (AD-3)** : aucun appel à l'API Anthropic ne réutilise un historique de conversation.
- **Orchestration côté client, échec = abandon total (AD-4)** : jamais de moyenne ou d'affichage partiel si un appel échoue.
- **Pas de persistance (AD-5)** : pas de `localStorage`, pas de base de données, état 100 % en mémoire React.
- **Cohérence visuelle** : couleurs et polices via les tokens de `app/globals.css` (`bg-primary`, `text-foreground`, etc.), jamais de couleur en dur.
- **Pas de sur-ingénierie** : pas d'abstraction, de configuration ou de gestion d'erreur pour un cas qui ne peut pas se produire dans ce POC.

Une fois les remarques du review traitées, la PM relit et approuve elle-même la fusion (dernier mot avant `main`, conformément à `CLAUDE.md`).

## Définition du "fini" (Definition of Done)

Une story est terminée quand :

- [ ] Tous les critères d'acceptance de la story (`epics.md`, format Given/When/Then) sont satisfaits.
- [ ] Tous les scénarios de test de la story (`TESTING.md` / section de la story) ont été exécutés et sont passés — dans le navigateur réel, pas seulement en lecture de code.
- [ ] Le lint (`npm run lint`) est propre.
- [ ] Si la PR contient du code : elle est passée par `/bmad-code-review` et les remarques retenues sont traitées.
- [ ] La PM a approuvé la fusion vers `main`.
- [ ] Si le comportement change par rapport à ce qui est écrit dans le PRD, l'architecture ou les epics, ces documents sont mis à jour dans la même PR (pour ne jamais laisser la doc mentir sur le code).
