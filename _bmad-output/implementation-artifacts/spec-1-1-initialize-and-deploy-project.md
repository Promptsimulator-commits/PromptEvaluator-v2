---
title: 'Initialize and deploy the project'
type: 'chore'
created: '2026-09-04'
status: 'done'
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
- [x] `package.json`, `app/`, `next.config.mjs` -- scaffold via `create-next-app` (App Router, Tailwind, JavaScript, ESLint); Tailwind 4 is CSS-configured (no `tailwind.config.js`) -- establishes the project skeleton every later story builds on
- [x] `.gitignore`, `.env.local.example` -- ensure `.env.local` and `node_modules` are ignored; document the required `ANTHROPIC_API_KEY` var without a real value -- prevents secret leakage
- [x] git repository -- init, first commit, create/connect GitHub remote (per GITHUB_SETUP answer), push -- gives the project durable, shareable history
- [x] Vercel project -- create/connect deployment (per VERCEL_SETUP answer), set `ANTHROPIC_API_KEY` as a Vercel env var -- makes the app reachable at a public URL for the demo. Deployed at https://prompt-evaluator-pi.vercel.app/ without the key (blocked on budget — see Implementation Notes); env var to be added once available

**Acceptance Criteria:**
- Given no repo or project exists, when initialization completes, then a GitHub repo exists containing the scaffolded Next.js 16.3 + Tailwind project, and it is deployed on Vercel with `ANTHROPIC_API_KEY` set as an environment variable (never committed to git)
- Given the deployment is live, when the Vercel URL is opened, then the page loads without error

## Implementation Notes

- Scaffolded with Next.js 16.3.4 + Tailwind 4.3.3, JavaScript, ESLint. Local build succeeds (`npm run build`).
- Repo created at `https://github.com/Promptsimulator-commits/Prompt-evaluator.git`; local `main` branch pushed and tracking `origin/main` (commits: `0d56fcb` scaffold, `b6d9412` README).
- `README.md` rewritten with project description, stack, and setup instructions (default `create-next-app` README replaced).
- Blocker: no Anthropic API key yet — the PM needs budget sign-off from their manager first. Does not block this story (the skeleton needs no key to load) but does block Story 1.3 (execution) until resolved. Vercel deployment proceeds without `ANTHROPIC_API_KEY` set; to be added via Vercel dashboard (Project → Settings → Environment Variables) once available.

## Verification

**Commands:**
- `npm run build` -- expected: build succeeds locally with no errors
- open the Vercel deployment URL in a browser -- expected: page loads (HTTP 200), no console errors

**Manual checks (if no CLI):**
- Confirm `.env.local` is listed in `.gitignore` and was never staged/committed — ✅ confirmed, only `.env.local.example` tracked
- Confirm the Vercel project's environment variables include `ANTHROPIC_API_KEY` — ⏸ deferred, no key available yet (budget pending); deployment verified working without it
- Confirmed https://prompt-evaluator-pi.vercel.app/ loads (HTTP 200, default Next.js placeholder page, zero console errors)

## Review Triage Log

- **false** — Missing `@anthropic-ai/sdk` dependency in `package.json`. Not needed by this story; the SDK is first consumed in Story 1.3 (`/api/execute`). No bad outcome at this point in the build.
- **false** — Boilerplate `app/page.js`/`app/layout.js` not yet reflecting the Prompt Evaluator UI. Expected: this story's intent is scaffolding only; UI is Story 1.2's scope.
- **false** — No `app/api/**` routes present despite `ANTHROPIC_API_KEY` being wired in `.env.local.example`. Expected: routes are built in Stories 1.3/1.4/2.1, not this one.
- **patch** (medium) — `package.json` pins `"tailwindcss": "^4"` and `"@tailwindcss/postcss": "^4"` (loose ranges) while the README and architecture spine document an exact pinned version, `4.3.3`. Verified: confirmed in `package.json`. Left as-is, the installed version can silently drift past what was verified/decided. Fix: pin both to `4.3.3` exactly.
- **false** — Missing `package.json` metadata (`description`, `license`, `author`, `repository`) / no `LICENSE` file. Not required for a private internal POC; adding a license is a real decision, not a direct correction — rejected as low value here.
- **false** — No test tooling or CI configuration. Explicitly excluded by this story's frozen intent ("Never: ... no CI/CD pipeline beyond Vercel's default git-push deploy").
- **false** — `README.md` (English) vs `CLAUDE.md` (French) language mismatch. Intentional: code/docs in English per explicit user decision, `CLAUDE.md` (working instructions between user and agent) in French to match the working language.
- **false** — `AGENTS.md` committed despite being regenerated by `next dev`. Verified: the file's own text explicitly recommends committing it ("committing it with your work keeps the tree clean") — working as designed, not a defect.
- **false** — `.gitignore` excludes `/_bmad/` without inline documentation of why. Cosmetic; explained in the commit message. No bad outcome.
- **false** — `next.config.mjs` left at defaults with no note about future timeout/streaming config for repeated Claude calls. Not this story's concern (surfaces, if at all, in Story 1.3); no bad outcome yet.
- **false** — Claimed missing `public/*.svg` assets referenced by `app/page.js`. Verified: all five files (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) exist in `public/` — the review diff excluded that directory for size reasons, producing a false positive.
- **false** (low) — `next/font/google` (Geist) fetches font files at build time with no offline fallback. Default `create-next-app` behavior, not introduced by this story; `npm run build` already succeeded in this environment.
- **rejected — fix would edit this build's spec** — Task description names `next.config.js`/`tailwind.config.js`, but the actual scaffold produced `next.config.mjs` and no `tailwind.config.js` (Tailwind 4 is CSS-configured, no JS config file). The code is correct for Tailwind 4; only the spec's task wording was stale (written against Tailwind 3 conventions).
- **rejected — fix would edit this build's spec** — Acceptance Criteria states the deployment has `ANTHROPIC_API_KEY` set, but it does not yet (budget pending). Already surfaced and accepted as a known, communicated exception; spec's Execution/Implementation Notes already reflect the real state.
- **verification-gap layer: no findings** — diff contains no behavioral logic (pure scaffold/config/docs); nothing to trace against tests.
