# Prompt Evaluator

> 🚧 **Version 2 — in development.** New dimension-based scoring (Objectif/Contexte/Exemples/Contraintes, textual signal + behavioral signal), no manually-entered acceptance criteria. V1 (current mechanics: manual criteria + compliance score) stays live, frozen, in [`PromptEvaluator`](https://github.com/swoodpartners/PromptEvaluator).

POC: a practice tool for the "Prompting Produit" skill. Test a prompt across multiple runs, score it against your own acceptance criteria, and get structured improvement suggestions — before you use it for real.

Status: **work in progress** (3-day POC, pre-demo).

## What it does

1. **Evaluate** — enter a prompt and free-text acceptance criteria. The prompt runs 5 times (independent contexts), each result is scored against your criteria, and you see the average score plus per-criterion stability (how often each criterion was met across the 5 runs).
2. **Analyze** — at any point, get an assessment of the prompt itself across 4 dimensions (persona, objective, constraints, examples), with concrete improvement suggestions.

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

Full PRD, architecture decisions, and epics/stories live in [`_bmad-output/planning-artifacts/`](_bmad-output/planning-artifacts/) (`prd-v2.md`, `epics-v2.md`, `ARCHITECTURE-SPINE-v2.md`). These currently still describe V1's mechanics, inherited as the starting point — they'll be rewritten as the new dimension-based scoring is designed. Working instructions for whoever develops this project are in [`CLAUDE.md`](CLAUDE.md). Branch/PR/review workflow is in [`CONTRIBUTING-v2.md`](CONTRIBUTING-v2.md), and the testing approach is in [`TESTING-v2.md`](TESTING-v2.md).
