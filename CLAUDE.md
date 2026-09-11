# Prompt Evaluator — Instructions de travail

> 🚧 **Version 2 — en développement.** Nouvelle mécanique de notation par 4 dimensions (Objectif/Contexte/Exemples/Contraintes, signal textuel + signal comportemental), sans critères d'acceptance saisis à la main. La V1 (mécanique actuelle : critères manuels + note par conformité) reste en ligne, figée, dans [`PromptEvaluator`](https://github.com/swoodpartners/PromptEvaluator).

## Comment travailler avec moi

- **Demande toujours mon accord avant d'agir** pendant le développement (créer un fichier, installer une dépendance, exécuter une commande qui modifie quelque chose, etc.) — je valide avant que tu procèdes, à chaque fois.
- **Vulgarise quand c'est technique.** Je suis PM, pas développeur — explique les concepts et le "pourquoi" en langage accessible quand un point est très technique, ne suppose pas que je connais le jargon.

Contexte : POC développé en vibecoding (PM + Claude Code), délai de 3 jours. Voir `_bmad-output/planning-artifacts/` pour le PRD, l'architecture et les epics/stories.

## Process de développement

- **Workflow** : une branche par story, PR vers `main`, revue via le skill `/bmad-code-review`, puis approbation finale par la PM avant fusion. Détails dans [`CONTRIBUTING-v2.md`](CONTRIBUTING-v2.md).
- **Tests** : scénarios Gherkin (Given/When/Then) vérifiés manuellement dans le navigateur avant chaque PR, pas de framework de test automatisé pour ce POC (décision assumée, voir pourquoi dans [`TESTING-v2.md`](TESTING-v2.md)). Check-list des cas limites à couvrir systématiquement : entrées, erreurs API/réseau, séquencement, sécurité.
