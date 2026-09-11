# Spec des 4 dimensions — Prompt Evaluator

> Document de départ fourni par la PM (2026-09-11), point de départ de la conception V2. Plusieurs décisions ci-dessous ont été révisées depuis — voir `_bmad-output/implementation-artifacts/session-log-2026-09-11-v2-design.md` pour l'état à jour (notamment : passage à 3 dimensions, critères d'acceptance déplacés dans le prompt + extraction automatique, paliers de note révisés).

Chaque dimension est notée sur **10**, à partir de deux sources de signal complémentaires :
- **Signal textuel** : analyse directe du prompt par le LLM évaluateur
- **Signal comportemental** : variance observée entre les 3 variantes de contenu générées à partir du même prompt

Le signal textuel détecte ce qui est *écrit*. Le signal comportemental détecte ce qui est *réellement flou pour le modèle*, même quand le texte semble correct. La note reflète les deux : le signal textuel donne un **score de base**, le signal comportemental agit comme **correctif** (une forte variance sur l'axe concerné pénalise la note, même si le texte semblait clair).

**Note finale du prompt** = moyenne simple des 4 notes de dimension (arrondie à 1 décimale).

### Légende des libellés (commune aux 4 dimensions)

| Plage | Libellé |
|---|---|
| 0–2 | Absent |
| 3–5 | À clarifier |
| 6–8 | Clair |
| 9–10 | Très clair |

---

## 1. Objectif — /10

**Définition** : le but précis et actionnable de la demande — quoi produire, avec quel verbe d'action, pour quel usage immédiat. Pas seulement le sujet, mais la tâche.

| Note | Libellé | Ancrage |
|---|---|---|
| 0–2 | Absent | Sujet mentionné sans tâche ("parle-moi de X") |
| 3–5 | À clarifier | Tâche nommée mais portée floue : verbe d'action présent, mais pas de délimitation (longueur, angle, nombre d'éléments) |
| 6–8 | Clair | Verbe d'action + livrable défini, périmètre encore partiellement ouvert |
| 9–10 | Très clair | Verbe d'action + livrable défini + périmètre totalement délimité (usage final explicite) |

**Signal textuel** : présence d'un verbe d'action explicite (rédige, résume, compare, liste, transforme…) associé à un objet délimité.

**Signal comportemental (correctif)** : si les 3 variantes divergent sur le *sujet traité lui-même*, l'angle, ou le niveau de détail global → retirer 2 à 4 points au score textuel, selon l'ampleur de la divergence.

**Exemple avant/après** :
> Avant (note ~1) : "Parle-moi de ce document"
> Après (note ~9) : "Résume ce document en 6 points pour quelqu'un qui n'a pas lu la version complète"

---

## 2. Contexte — /10

**Définition** : les informations de fond nécessaires pour calibrer la réponse — qui est le destinataire, dans quelle situation, avec quel ton/registre implicite attendu. Inclut le **persona**, sous deux formes possibles : le rôle de l'utilisateur ("je suis product manager") et/ou le rôle assigné à l'IA ("imagine que tu es DRH").

| Note | Libellé | Ancrage |
|---|---|---|
| 0–2 | Absent | Aucune indication sur le destinataire, la situation, ou un quelconque persona |
| 3–5 | À clarifier | Destinataire, situation ou persona mentionnés partiellement (ex : "un client" sans préciser B2B/B2C ; ou persona donné mais sans lien avec l'usage final) |
| 6–8 | Clair | Destinataire + situation précisés (avec ou sans persona explicite), registre attendu encore implicite |
| 9–10 | Très clair | Destinataire + situation + registre attendu explicites, persona cohérent avec l'objectif quand il est pertinent |

**Signal textuel** : mention explicite d'un destinataire, d'une situation, du "pourquoi" derrière la demande, ou d'un persona (marqueurs : "je suis…", "en tant que…", "imagine que tu es…", "tu es un expert en…").

**Signal comportemental (correctif)** : si les 3 variantes divergent sur le ton, le registre, le niveau d'expertise supposé du lecteur, ou l'angle pris (celui d'un persona plutôt qu'un autre) → retirer 2 à 4 points.

**Exemples avant/après** :
> Avant (note ~1) : "Rédige un message"
> Après (note ~9) : "Rédige un message court pour annoncer un retard de livraison à un client B2B, avec un ton professionnel et apaisant"

> Avant (note ~3, persona seul sans reste du contexte) : "Imagine que tu es DRH, aide-moi sur ce sujet"
> Après (note ~9) : "Je suis product manager et je dois convaincre le DRH d'adopter un nouvel outil. Imagine que tu es ce DRH, sceptique sur le ROI : quelles objections me ferais-tu ?"

---

## 3. Exemples — /10

**Définition** : démonstrations concrètes de ce qu'est une bonne réponse — un ou plusieurs exemples input/output illustrant le pattern attendu (style, granularité, structure).

| Note | Libellé | Ancrage |
|---|---|---|
| 0–2 | Absent | Aucun exemple fourni |
| 3–5 | À clarifier | Exemple donné mais incomplet, ambigu, ou peu représentatif du cas réel |
| 6–8 | Clair | Un exemple clair, mais pattern pas totalement généralisable (cas limite non couvert) |
| 9–10 | Très clair | Un ou plusieurs exemples qui illustrent précisément le pattern voulu |

**Signal textuel** : présence littérale d'un couple input/output ou d'un modèle de sortie dans le prompt.

**Signal comportemental (correctif)** : si le style général de mise en forme (registre, structuration, longueur des phrases) diverge fortement entre les 3 variantes alors que le fond reste cohérent → retirer 2 à 4 points.

**Exemple avant/après** :
> Avant (note ~0) : "Convertis ce jargon technique en langage clair"
> Après (note ~9) : "Voici un exemple de conversion : 'Le système implémente des protocoles de chiffrement de bout en bout' → 'Le système protège les données à chaque étape.' Convertis maintenant ce texte sur le même modèle : [texte]"

---

## 4. Contraintes — /10

**Définition** : les limites explicites imposées sur la sortie — format attendu (structure, longueur, medium) **et** ce qu'il faut éviter (exclusions, interdits).

| Note | Libellé | Ancrage |
|---|---|---|
| 0–2 | Absent | Aucune contrainte de forme ni d'exclusion |
| 3–5 | À clarifier | Contrainte mentionnée mais non quantifiée ("sois concis", "évite le jargon" sans seuil) |
| 6–8 | Clair | Contrainte quantifiée sur un seul axe (format OU longueur OU exclusions) |
| 9–10 | Très clair | Contrainte quantifiée sur plusieurs axes (format + longueur + exclusions) |

**Signal textuel** : mots-clés de format (tableau, liste, JSON, nombre de mots/caractères) et marqueurs d'exclusion ("évite", "ne dépasse pas", "sans", "ne fais pas").

**Signal comportemental (correctif)** : si la longueur, la structure, ou le format de sortie divergent fortement entre les 3 variantes → retirer 2 à 4 points.

**Exemple avant/après** :
> Avant (note ~1) : "Aide-moi sur ce sujet"
> Après (note ~9) : "Donne-moi un tableau avec les avantages, limites et points de vigilance, sans dépasser 150 mots par colonne"

---

## Calcul de la note finale

```
note_finale = (note_objectif + note_contexte + note_exemples + note_contraintes) / 4
```

La moyenne simple ne change pas. Pour éviter qu'un vrai trou ne soit masqué (ex : 9, 9, 9, 1 → 7/10 qui paraît bon), la note globale et le point faible sont **affichés séparément**, jamais fusionnés dans un seul calcul.

### Règle d'affichage du point faible

- **Note globale** : toujours affichée, mise en avant (ex : "7,0/10")
- **Point faible** : dimension la plus basse, affichée à part — uniquement si son écart avec la moyenne des 3 autres dimensions est **≥ 3 points**. En dessous de ce seuil, ne rien afficher : un profil homogène n'a pas de point faible diagnostique à signaler.

| Cas (Obj/Ctx/Ex/Ctr) | Note globale | Point faible affiché ? |
|---|---|---|
| 9, 9, 9, 9 | 9,0 | Non (aucun écart) |
| 8, 8, 8, 6 | 7,5 | Non (écart de 2, sous le seuil) |
| 9, 9, 9, 1 | 7,0 | Oui — Contraintes : 1/10 |
| 7, 7, 3, 7 | 6,0 | Oui — Exemples : 3/10 |

### Contenu du message associé au point faible

Quand un point faible est affiché, le message reprend :
1. L'ancrage correspondant à la note obtenue (voir tableaux par dimension ci-dessus)
2. L'exemple avant/après de la dimension concernée

Objectif : que l'apprenant sache immédiatement *quoi corriger*, sans avoir à déduire l'action depuis le chiffre seul.
