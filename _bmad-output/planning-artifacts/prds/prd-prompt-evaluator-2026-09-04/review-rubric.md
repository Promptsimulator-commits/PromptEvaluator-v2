# PRD Quality Review — Prompt Evaluator

## Overall verdict

This is a tight, honestly-scoped POC PRD that matches its 3-day, single-operator, decision-gate stakes — the Non-Goals and Future Considerations sections do real exclusionary work, most FRs carry explicit formulas or enumerated outputs an engineer can build straight from, and the single UJ is load-bearing (it explains the recommended evaluate→analyze→rewrite loop) rather than decorative. The main risks are one unoperationalized Success Metric that sits in tension with the stated single-operator Non-Goal, an undefined "critère instable" threshold at the heart of Feature 2's value proposition, and a stale unresolved question left in addendum.md after the main PRD already resolved it. None of these block a 3-day build, but they are the specific things worth tightening before or during implementation.

## Decision-readiness — adequate

The core decision this PRD sets up — demo to the responsable, get a go/no-go on rolling out to 30 consultants — is unambiguous, and the criteria for judging the demo are explicit ("La démo se déroule sans bug," "L'ensemble des exigences P0 ... sont développées"). Real trade-offs are named rather than smoothed: the Haiku-vs-"real model" tension is stated as a genuinely open question deferred to V1 rather than answered in the next sentence, and the budget ceiling (~10-20€) is stated as a Goal with no enforcement mechanism, which is an honest trade-off given the stated POC stakes.

One real tension is not surfaced anywhere as a decision or a flagged question: the Success Metrics section commits to collecting "feedback qualitatif ... auprès des consultants ayant testé l'outil" (§ Success Metrics), but the Non-Goals section states the POC is a "démo sur le poste du PM, pas de multi-utilisateurs" (§ Non-Goals) and the Timeline places consultant deployment strictly after a go decision. Nothing in Requirements, User Journey, or Timeline describes how or when consultants test the tool during this 3-day POC. This is exactly the kind of tension a `[NOTE FOR PM]` callout exists to catch, and the document doesn't use that convention anywhere.

### Findings
- **high** Success metric with no described mechanism (§ Success Metrics, § Non-Goals) — "Feedback qualitatif recueilli ... auprès des consultants ayant testé l'outil" presupposes consultants use the tool, but § Non-Goals says the POC is single-operator on the PM's machine with no multi-user support, and § Timeline Considerations only schedules a demo to the responsable, not a consultant testing phase. A reader can't tell if this SM is in scope (and unoperationalized) or a copy-paste from a later-phase plan. *Fix:* either add a line describing how/when this feedback gets collected (e.g., informally during the demo session, on the PM's machine, sequentially), or drop this SM from the pilot's scope and reserve it for the future rollout PRD.

## Substance over theater — strong

No persona bloat (a single UJ, used throughout, not decorative), no differentiation/innovation section manufactured for template completeness, no NFR boilerplate ("must be scalable/secure") anywhere — there's no NFR section at all, which is appropriate rather than a gap given the stated stakes. The Problem Statement is grounded in specifics ("skill tree IA du cabinet," "skill 'Prompting Produit' (niveau 2)") rather than a swappable vision statement. Goals are specific to this product, including one that could read as circular ("Démontrer ... que l'ensemble des spécifications de ce PRD ont été développées") but is legitimate given this PRD's actual purpose is a build-and-demo gate, not a market-facing product goal.

## Strategic coherence — adequate

The thesis is explicit and consistent: informal practice and a theoretical e-learning module alone don't teach prompting; the tool must "faire pratiquer réellement le prompting, avec un retour objectif et pédagogique" (§ Problem Statement). Both P0 features trace directly to that thesis — Feature 1 supplies the objective signal (multi-run scoring reveals prompt stability), Feature 2 supplies the pedagogical layer (structured, dimension-by-dimension explanation rather than a rewritten prompt to copy-paste). This is a coherent problem-solving-shaped MVP, not a backlog with headings.

Where it weakens: three of the four Success Metrics measure process completion (no bugs, P0 shipped, decision obtained) rather than validating the pedagogical thesis itself. The one metric that could validate it — qualitative consultant feedback — doesn't specify that it probes learning value versus general satisfaction, and (per the Decision-readiness finding above) isn't tied to any described collection mechanism. No counter-metrics are needed given the operational nature of the other three SMs, so that absence isn't a gap.

### Findings
- **medium** Success Metrics measure shipping, not the thesis (§ Success Metrics) — "L'ensemble des exigences P0 de ce PRD sont développées et fonctionnelles" and "La démo se déroule sans bug" confirm the build happened, not that the tool achieved its stated Goal of helping users "identifier et comprendre ses erreurs de prompting" (§ Goals). *Fix:* if feasible within 3 days, add one qualitative signal tied directly to the thesis (e.g., a specific question in the feedback collection about whether the analysis helped the user understand a prompting mistake), even informally.

## Done-ness clarity — adequate

Most FRs are unusually precise for a 3-day POC PRD: FR3 specifies exact call count and context isolation, FR5/FR6 give exact formulas, FR7 enumerates the exact fields shown to the user, FR9 gives the exact 4-dimension taxonomy with a fixed present/clear/absent scale. An engineer (or Claude Code, vibecoding) can build directly from these without guessing at "reasonable" or "user-friendly" language — none of that vague phrasing appears in the P0 set.

Two specific gaps remain:

### Findings
- **medium** "Critères instables" undefined (FR10, UJ-1 step 3-4) — FR10 says the analysis "pointe les critères instables identifiés," and UJ-1 frames this as revealing "si son prompt est stable ou non" (line 40), but no FR states the threshold (e.g., is a criterion validated 3/5 times unstable? Only strictly between 1 and 4 out of 5?). This is the core signal Feature 2 adds when evaluation results exist, so leaving it undefined risks an arbitrary implementation choice for the feature's most pedagogically-loaded output. *Fix:* add one line defining "instable" (e.g., "validé entre 1 et 4 fois sur 5, ni jamais ni toujours").
- **low** No minimum on criteria count (FR2, FR5) — FR2 places no lower bound on the number of acceptance criteria entered, and FR5's formula "(critères validés / total des critères) × 10" divides by that count, so a 0-criteria submission is a division by zero with no stated handling. *Fix:* add "au moins 1 critère requis" to FR2, or explicitly state the fallback behavior.

## Scope honesty — adequate

The Non-Goals section is the strongest section in the document for this dimension — six explicit, specific exclusions (auth, persistence, multi-LLM, configurable N, e-learning module, 30-user deployment), each matching a real scoping decision rather than a vague catch-all. Future Considerations cleanly separates every deferred item with a one-line rationale (e.g., "Choix du modèle 'réel' ... différer à la V1"). De-scoping reads as proposed, not silently assumed.

Two things pull this down from strong: the consultant-feedback mechanism gap already flagged under Decision-readiness is, at its root, an omission the reader must infer rather than one the PRD states explicitly. And addendum.md — a document the main PRD points to directly via FR11 ("voir addendum.md") — closes with a question the main PRD has already answered, which could mislead anyone (including the implementer) who reads the addendum on its own.

### Findings
- **medium** Stale open question in addendum.md contradicts the resolved decision in prd.md (addendum.md, "Point à clarifier avec l'utilisateur," lines 24-26) — addendum.md asks "Prompt Evaluator remplace-t-il le mécanisme du Prompt Trainer ... ?" as if unresolved, but prd.md's Problem Statement already states "Ce projet **remplace** l'approche précédente ('Prompt Trainer' ...)" (line 16), and the memlog confirms this was decided ("Relation avec Prompt Trainer: REMPLACEMENT"). *Fix:* update addendum.md's closing section to state the resolution instead of posing it as an open question, since FR11 sends readers there directly.
- Open-items density is appropriately low for the stated stakes: 1 genuine Open Question, 0 `[ASSUMPTION]` tags, 0 `[NOTE FOR PM]` callouts. Given this is a low-stakes internal pilot PRD, that's not a blocker — but see Mechanical notes on the complete absence of these conventions.

## Downstream usability — adequate (matters less here)

This PRD is not chain-top in the formal sense — per the memlog, development is direct "vibecoding, PM + Claude Code," not a PRD → UX-spec → architecture → stories pipeline, so strict cross-reference/traceability rigor matters less than it would for a chain-top document. That said, the mechanics are clean where it counts: FR IDs (FR1-FR11) are contiguous and unique, the single UJ is properly named and carries context inline, and FR11's cross-reference to addendum.md resolves to real content.

### Findings
- **low** Minor terminology drift between "note," "score," and "moyenne" (FR6, FR7, UJ-1 step 3) — FR6 defines "la note finale du prompt = moyenne des 5 scores d'exécution," FR7 calls the same concept "la moyenne globale," and UJ-1 calls it "la moyenne" — three different words for one concept across three passages. Doesn't create real ambiguity given the formula is stated once precisely, but a Glossary term would tighten it.
- **low** Unanchored cross-reference (§ Nice-to-Have, line 68) — "cohérent avec l'objectif 'intuitif et simple d'utilisation'" references a goal phrase that doesn't appear verbatim (or in substance) anywhere in § Goals. Cosmetic since this is a P1 item, but it's a cross-reference that doesn't resolve.

## Shape fit — strong

The PRD correctly takes the capability-spec shape appropriate to a single-operator internal tool rather than over-formalizing with multiple personas or UJ density — one UJ is used, and it earns its place by narrating the recommended-but-not-enforced evaluate→analyze→rewrite→re-evaluate loop that the FRs alone wouldn't convey (why FR8 makes analysis available "à tout moment," why the ordering is a recommendation not a gate). Success Metrics are appropriately operational (demo success, decision obtained) rather than forced into user-facing engagement metrics that wouldn't fit a 3-day pilot. The brownfield relationship to the prior "Prompt Trainer" project is handled well: the Problem Statement states the replacement decision plainly, and addendum.md distinguishes exactly which design patterns carry over (criteria-as-judgment-instrument, per-criterion feedback, serverless key handling) from what doesn't (fixed exercise catalog, fixed 4-criterion score formula, localStorage-only progression) — this is genuine brownfield traceability, not hand-waving.

## Mechanical notes

- **Bracket-tag conventions absent entirely.** The document uses none of `[ASSUMPTION: …]`, `[NOTE FOR PM]`, or `[NON-GOAL for MVP]` anywhere, even though the content those tags mark is present in prose (Non-Goals reads as the non-goal callouts; the memlog's resolved assumption about skill-content overlap never surfaces as an inline tag). For a solo coaching-path PRD at this stakes level this is a reasonable simplification, but it means there's no Assumptions Index to roundtrip-check, and a reader relying on the tag convention to scan for open tensions will find none even where they exist (see the consultant-feedback gap above).
- **Terminology**: "note" (FR6) / "score" (FR5, FR7) / "moyenne" (UJ-1) refer to the same computed value — see Downstream usability finding above.
- **ID continuity**: FR1-FR11 contiguous, no gaps or duplicates. Single UJ (UJ-1), named protagonist (Julie), no floating UJs. No SM IDs, not required at this scale.
- **Cross-file consistency**: FR11 → addendum.md resolves correctly for the architecture-pattern content; addendum.md's closing question is stale relative to prd.md (see Scope honesty finding above).
