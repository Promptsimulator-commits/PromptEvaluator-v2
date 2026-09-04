---
title: 'Initialize and deploy the project'
type: 'chore'
created: '2026-09-04'
status: 'in-progress'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'NO_VCS'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** No repository, no Next.js project, and no deployment exist yet for Prompt Evaluator. Every other story (input UI, execution, scoring, analysis) needs a working, publicly reachable skeleton to build on.

**Approach:** Scaffold a Next.js 16.3 (App Router) + Tailwind CSS project locally in JavaScript (no TypeScript, to keep the codebase approachable for a non-developer maintainer), initialize git, create a GitHub repository, and deploy it to Vercel with `ANTHROPIC_API_KEY` configured as an environment variable, so the team has a live URL to iterate against from day one.

**Decisions:** GitHub repo is created by the human via github.com (empty repo), URL handed to the agent to add as remote and push (GITHUB_SETUP = B). Vercel deployment is created by the human via the Vercel dashboard (Import Project from the pushed GitHub repo), resulting URL handed to the agent (VERCEL_SETUP = B). The agent does not need `gh` or Vercel CLI auth for this story.

## Boundaries & Constraints

**Always:** Next.js 16.3 App Router; Tailwind CSS 4.3.3; JavaScript, not TypeScript; single Vercel environment (no staging); `ANTHROPIC_API_KEY` only in Vercel env vars and local `.env.local` (git-ignored), never committed.

**Never:** no login/auth pages, no database, no `NEXT_PUBLIC_`-prefixed secrets, no CI/CD pipeline beyond Vercel's default git-push deploy.

</frozen-after-approval>

## Code Map

- (none — greenfield, no existing codebase)

## Tasks & Acceptance

**Execution:**
- [ ] `package.json`, `app/`, `next.config.js`, `tailwind.config.js` -- scaffold via `create-next-app` (App Router, Tailwind, JavaScript, ESLint) -- establishes the project skeleton every later story builds on
- [ ] `.gitignore`, `.env.local.example` -- ensure `.env.local` and `node_modules` are ignored; document the required `ANTHROPIC_API_KEY` var without a real value -- prevents secret leakage
- [ ] git repository -- init, first commit, create/connect GitHub remote (per GITHUB_SETUP answer), push -- gives the project durable, shareable history
- [ ] Vercel project -- create/connect deployment (per VERCEL_SETUP answer), set `ANTHROPIC_API_KEY` as a Vercel env var -- makes the app reachable at a public URL for the demo

**Acceptance Criteria:**
- Given no repo or project exists, when initialization completes, then a GitHub repo exists containing the scaffolded Next.js 16.3 + Tailwind project, and it is deployed on Vercel with `ANTHROPIC_API_KEY` set as an environment variable (never committed to git)
- Given the deployment is live, when the Vercel URL is opened, then the page loads without error

## Implementation Notes

## Verification

**Commands:**
- `npm run build` -- expected: build succeeds locally with no errors
- open the Vercel deployment URL in a browser -- expected: page loads (HTTP 200), no console errors

**Manual checks (if no CLI):**
- Confirm `.env.local` is listed in `.gitignore` and was never staged/committed
- Confirm the Vercel project's environment variables include `ANTHROPIC_API_KEY`
