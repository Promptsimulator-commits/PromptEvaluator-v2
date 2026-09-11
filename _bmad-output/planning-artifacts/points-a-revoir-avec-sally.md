# Points à revoir avec Sally (UX) — V2

Liste vivante, mise à jour au fur et à mesure de la conception de la V2. Chaque entrée : le point, le contexte, et ce qui reste à trancher.

## 1. Explication de la note par dimension

**Contexte** : l'outil évalue le prompt (et par conséquent la qualité des réponses qu'il produit) — au-delà du chiffre et du libellé (Absent/À clarifier/Clair/Très clair), l'utilisateur doit comprendre *ce qui a été bien fait* et *ce qui est améliorable*, avec une **suggestion concrète de reformulation** du prompt — dans une logique de progression pédagogique, pas juste un score brut. Le document de départ prévoyait, pour chaque dimension : l'ancrage correspondant à la note obtenue + un exemple avant/après concret.

**À trancher avec Sally** : où et comment afficher cette explication à l'écran (toujours visible, dépliable, seulement sur la dimension la plus faible, sur les 3 ?), et sa mise en forme.

## 2. La notion de "paliers" (grille note → libellé)

**Contexte** : aujourd'hui la note de chaque dimension (0-10) est traduite en mot via une grille (0 = Absent, 1-5 = À clarifier, 6-8 = Clair, 9-10 = Très clair). Pas encore certain que ce soit la meilleure façon de présenter l'information à l'utilisateur.

**À trancher avec Sally** : garde-t-on cette présentation note + libellé, ou une autre forme de restitution serait plus claire/actionnable pour l'utilisateur ?

## 3. Les 3 critères de base (fixes) — affichage

**Contexte** : 3 critères toujours appliqués (orthographe/grammaire, cohérence, même langue que le prompt), fixes, non modifiables par l'utilisateur — décision produit déjà prise.

**À trancher avec Sally** : comment les afficher à l'écran à côté des critères extraits du prompt (modifiables, eux) pour que la différence de statut (fixe vs modifiable) soit visuellement claire et non frustrante.

## 4. Passage de 4 à 3 dimensions (suppression de "Exemples")

**Décision produit (validée)** : "Exemples" est retiré comme dimension autonome, intégré dans **Contraintes** — un exemple concret devient un 3ᵉ axe de cette dimension (avec format/longueur et exclusions), car c'est la façon la plus précise de spécifier un format attendu. Les 3 dimensions finales : **Objectif, Contexte, Contraintes**.

Nouveaux ancrages "Contraintes" (0 = Absent / 1-5 = À clarifier / 6-8 = Clair / 9-10 = Très clair), sur 3 axes possibles : format/longueur, exclusions, exemple concret.

**À trancher avec Sally** : impact sur l'écran — 3 cartes de dimension au lieu de 4 (mise en page, équilibre visuel).

## 5. Vulgariser la méthode de calcul de la note pour l'utilisateur

**Contexte** : chaque dimension est notée en 2 temps — une note de départ à la lecture du prompt, puis une correction selon que les réponses générées divergent ou non entre elles (le "signal comportemental"). C'est un mécanisme à 2 étages, pas juste un chiffre — l'utilisateur doit pouvoir comprendre pourquoi sa note a bougé, sans qu'on lui déballe l'algorithme brut.

**À trancher avec Sally** : comment expliquer ce calcul en langage simple (ex. "on a testé ton prompt plusieurs fois : les réponses obtenues variaient sur X, ce qui a fait baisser la note") — à quel endroit de l'écran, et avec quel niveau de détail.

## 6. Écran d'extraction des critères + validation

**Contexte** : au clic sur "Envoyer", l'outil extrait des critères du prompt et les affiche pour relecture/modification avant de lancer réellement la génération des réponses.

**À trancher avec Sally** : maquette de cet écran intermédiaire (liste éditable, boutons ajouter/supprimer, bouton de confirmation finale).
