# Prompt Evaluator

> 🚧 **Version 2 — in development.** One action, "Envoyer": criteria are extracted automatically from the prompt (no manual entry), then the prompt is scored across 3 dimensions (Objectif/Contexte/Contraintes — textual signal + behavioral correction from response divergence). No more separate "Analyser" action. V1 (previous mechanics: manual criteria + compliance score, 4 dimensions) stays live, frozen, in [`PromptEvaluator`](https://github.com/swoodpartners/PromptEvaluator).

POC: a practice tool for the "Prompting Produit" skill. Test a prompt, get its criteria extracted automatically, run it multiple times, and get structured, dimension-by-dimension improvement suggestions — before you use it for real.

Status: **work in progress** (POC, pre-demo).

## What it does

1. **Envoyer** — enter a prompt and click the single business action. Criteria are extracted automatically from the prompt text and shown in an editable list for review (add/edit/remove) before generation starts.
2. **Generate & score** — the prompt runs N times (independent contexts, 1-10 runs, default 5). The N generated responses are shown as-is (no per-response score).
3. **Analyse par dimensions** — toggle to see the prompt scored on 3 dimensions (Objectif, Contexte, Contraintes), each 0-10 across 4 tiers (Absent/À clarifier/Clair/Très clair). Each dimension's score starts from a textual reading of the prompt, then gets corrected if the generated responses diverge on that axis — expand any dimension for what's working, what to clarify, and a concrete rewrite suggestion.

## Stack

Next.js 16.3 (App Router) · Tailwind CSS 4.3.3 · `@anthropic-ai/sdk` · Claude Haiku · deployed on Vercel.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project docs

Full PRD, architecture decisions, and epics/stories live in [`_bmad-output/planning-artifacts/`](_bmad-output/planning-artifacts/) (`prd-v2.md`, `epics-v2.md`, `ARCHITECTURE-SPINE-v2.md`), updated 2026-09-11 for the V2 mechanic. UX spines (`DESIGN.md`/`EXPERIENCE.md`) live under `_bmad-output/planning-artifacts/ux-designs/`. Working instructions for whoever develops this project are in [`CLAUDE.md`](CLAUDE.md). Branch/PR/review workflow is in [`CONTRIBUTING-v2.md`](CONTRIBUTING-v2.md), and the testing approach is in [`TESTING-v2.md`](TESTING-v2.md).
