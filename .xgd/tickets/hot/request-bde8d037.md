---
uid: request-bde8d037
id: REQ-89
type: request
title: 'Astro boots on every 1c command — silence ''Missing pages directory: src/pages'''
created_by: xgd
created_at: '2026-07-22T23:59:09.668656+00:00'
updated_at: '2026-07-23T02:50:10.402896+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: b4851b1de83d26cac5e7bd305717e3ffb38ae35e
    reconcile_sha: null
    main_sha: null
  version: 0.0.175
  story_points: 2
---

# Astro boots on every `1c` command — silence `Missing pages directory: src/pages`

## Symptom

Every `bin/1c` invocation prints to **stderr**, even commands that never render
(`list`, `repro`, `l1-gate`, `capture`, `values-diff`):

```
16:48:18 [WARN] Missing pages directory: src/pages
16:48:18 [vite] Re-optimizing dependencies because vite config has changed
```

Harmless (stderr only — no effect on stdout, `--json`, exit codes, or the produced
bundle), but noise on every command and misleading (there is no file-based Astro
routing in this CLI).

## Root cause (corrected after investigation)

The original diagnosis (eager module-registry import at CLI-load time) is **not**
the source. The warning is emitted by the **launcher**, `tools/generate/bin/1c.mjs`,
which unconditionally boots an Astro Vite dev server **before any CLI code loads**:

```
getViteConfig({ root, logLevel: 'error' }) → createServer(...) → ssrLoadModule(cli)
```

The launcher needs a Vite+Astro server to transpile the TypeScript CLI and compile
`.astro` module components via `ssrLoadModule`. Astro's Vite plugin scans the CWD
for `src/pages` **during server setup**, doesn't find one, and logs
`[WARN] Missing pages directory` through Astro's own logger. The existing launcher
comment already noted this and redirects stdout→stderr during setup (to keep
`--json` clean) — but never actually suppressed it, so it lands on stderr on every
command. The `logLevel: 'error'` passed to `getViteConfig` gates **Vite's** logger,
not **Astro's**, which is why it had no effect.

(The `[vite] Re-optimizing dependencies` line is transient — it fires only when the
Vite cache is invalidated, not on every run.)

Because the launcher boots Astro before the CLI graph is even imported, no amount of
lazy-import work inside `registry.ts` / `render.ts` can silence the warning. The
launcher is the only place that can.

Separately — and this is the real architectural gap the ticket points at — the
render path **always** constructed an `AstroContainer`, even for a page that is a
pure folded-L1 reproduction (REQ-88). `renderL1Document` is pure string templating
and needs zero Astro; only a **behavior-module** page needs the container.

## Fix (implemented)

1. **Launcher (`tools/generate/bin/1c.mjs`)** — pass `{ logLevel: 'error' }` as the
   **second** argument to `getViteConfig` (the inline *Astro* config), which gates
   Astro's own logger and drops the `Missing pages directory` WARN while still
   surfacing genuine errors. Every command is now quiet at setup.

2. **Render (`tools/generate/src/render/render.ts`)** — make Astro lazy in the
   render path: `astro/container` is now a **dynamic** import and the container is
   created **only** when the site actually has a behavior-module page
   (`pages.some(p => !p.l1 && p.modules.length > 0)`). An L1-only reproduction — and
   the empty starter — render with **zero** Astro container involvement. The
   container is threaded through as `Container | undefined`; the module path guards.

Not done (and why): the originally-proposed lazy module-registry / `getModule`-async
change is unnecessary — it does not silence the launcher warning (the real source)
and would only matter for a plain-Vite loader we are not introducing. Skipped to
keep the change surgical (it would otherwise churn ~8 existing conformance/render
test files for no acceptance benefit).

## Acceptance

- `1c list`, `1c repro`, `1c l1-gate`, `1c capture`, `1c values-diff` (and every
  other command) produce **no** `Missing pages directory` output on stderr.
- Rendering a **behavior-module** site still works — the container is created on
  demand and modules render identically.
- Rendering an **L1-only** site still works and constructs **no** `AstroContainer`.
- Free-coded: `test_UAT_FC_REQ-89_*` covering (a) a module site renders and DOES
  create a container, (b) an L1 site renders and does NOT create a container, and
  (c) the real `1c` binary boots with no `Missing pages directory` on stderr.

## Context

Surfaced during the REQ-88 L1-reproduction-pipeline walkthrough. Split out at the
operator's request so REQ-88 stays scoped to the pipeline itself. Not a blocker — the
warning is cosmetic — but worth closing so the reproduction CLI is quiet.