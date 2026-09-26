---
uid: bug-5c3e65f6
id: BUG-150
type: bug
title: bin/dev up starts the watching builder, not the frozen snapshot it just built
  — and every server that reads the changing tree should be deleted
created_by: EPIC-19
created_at: '2026-09-25T23:26:01.085217+00:00'
updated_at: '2026-09-25T23:26:01.085217+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
---

# `bin/dev up` starts the watching builder, not the frozen snapshot it just built — and every server that reads the changing tree should be deleted

## What happens

`bin/dev up` is the instructed way to start the local environment. It builds the
deployed dev snapshot and then serves something else.

Measured on this checkout, 2026-09-25, from one `bin/dev up` at 21:40 UTC:

| what | port | started by | reads |
|---|---|---|---|
| filing | 8790 | `bin/1c filing` | — |
| **builder** | **8788** | **`bin/1c builder` → `wrangler dev`** | **`src/`, live** |
| **public-site** | **8787** | **`pnpm --filter @1stcontact/public-site dev`** | **`src/`, live** |
| access-sim | 8799 | `bin/access-sim` | proxies to **8788** |
| *(the snapshot)* | *8789* | — | **nothing was listening** |

`apps/control-app/.dev-snapshot/` and `apps/public-site/.dev-snapshot/` were both
written by the deploy step at 21:40:07 and 21:40:08 — and then nothing served
them. [[REQ-318]] built the frozen environment, `bin/dev up` builds it on every
start, and the operator is handed the watching one.

The consequence is not theoretical. During one 13-minute stretch that evening the
8788 builder was restarted **four times** by merges landing in `xgd-working`,
which is the branch this checkout is on:

- 22:23:28 — `free-BUG-145` merged, rewriting `host-core.ts`, `spend-core.ts`,
  `spend.ts` and `router.ts`; wrangler rebuilt and replaced the Worker **three
  minutes into a live consultant turn**, destroying it;
- 22:35:05 and 22:36:32 — two more restarts from `free-REQ-320`;
- 22:35:11 — a build against a root `package.json` still holding `<<<<<<< HEAD`,
  which failed outright: `Expected string in JSON but found "<<"`. A
  half-finished merge does not merely restart the builder, it breaks it.

The operator was working in the builder believing he was on the frozen
environment, because he had started it the way he was told to. **He had no way to
know what he was running.** That is the failure: not the restart, but that the
question "what am I running?" has no reliable answer even after doing the right
thing.

## Why

Deliberate, and correctly deliberate at the time. EPIC-16 §L1:

> Settled by the operator: **everything we have goes** — `pnpm dev`,
> `pnpm dev:control` and `1c builder` as an operator entry point — **but the
> deletion is a separate step so the replacement can be proved first.**

`ps.ts` carries the same note in code:

    // builder's on purpose (EPIC-16 §L1): the old path is retired in a later step

and §M's ticket list says plainly: *"Retirement is deliberately unfiled … It is
filed when REQ-318 and REQ-319 are trusted."* Both have landed. This is that
ticket, and the first run showed the sequencing has a gap §L1 did not anticipate:
`bin/dev up` was allowed to keep starting the old path, so "run both side by side
until you trust the new one" became "run only the old one, and build the new one
every time without ever serving it."

## What this asks for

**1. `bin/dev up` serves the snapshot and nothing else.** After the deploy step it
starts `1c dev serve` for the control app, and the equivalent for the public site,
against `.dev-snapshot/`. `access-sim` proxies to the snapshot port. `1c ps`'s
port table, `bin/dev down` and `bin/dev reap` follow.

**2. Delete every entry point that serves from the changing tree.** Not
deprecated, not flagged off — deleted, so it cannot be reached by habit, by an
old shell history line, or by an agent reading `package.json`:

- `pnpm dev` (root `package.json`)
- `pnpm dev:control` (root `package.json`)
- `pnpm dev:public` (root `package.json`) and `dev` in
  `apps/public-site/package.json`
- `1c builder` as an operator entry point (`tools/generate/src/cli/index.ts`,
  `case 'builder'`)
- whatever in `dev-env.ts` and `ps.ts` exists only to describe them

If a watching server is still wanted for some narrow purpose, it comes back
later, named so nobody can mistake it for the dev environment, and it is not what
`bin/dev up` starts. It is not in scope here.

**3. Starting the environment says what it is serving, every time.** `1c dev
serve` already has the line — worker, env, deploy time, commit, snapshot path,
and *"FROZEN: editing a source file changes nothing here until `bin/deploy --env
dev`"*. `bin/dev up` must print it too, per served app. The operator must not have
to run a second command to learn what the first one started.

## Acceptance

- `bin/dev up` on a clean checkout leaves **no** `wrangler dev` reading `src/`.
  Asserted the way §K asked it: on the argv, every path under `.dev-snapshot/` or
  `.wrangler/state`, none under `src/`.
- `bin/dev up` prints, for each served app, what is being served and when it was
  deployed.
- Editing a source file while the environment is up changes nothing about what is
  served, and no restart happens. A merge landing in `xgd-working` while a turn is
  in flight does not touch the running environment.
- `grep -r "wrangler dev" package.json apps/*/package.json` finds nothing that
  serves from source. `1c builder` is gone as an entry point.
- `bin/dev down` stops what `bin/dev up` started, and `1c ps` names it correctly.
- `bin/deploy --env dev` remains the only way to change what is served.

## Boundaries

- The store does not move. `--persist-to .wrangler/state` stays as REQ-318 set it,
  so no dev data migrates as part of this.
- Not about *why* the merges land in the served checkout — the deploy-to-snapshot
  boundary is the answer to that, and this ticket is that answer being adopted.
  EPIC-19 Finding 10 stops being reachable once §L1 is finished.
- [[BUG-147]] (`bin/dev down` records the wrapper's pid) is separate and already
  free-coded; this ticket must not regress it — the snapshot servers have the
  same wrapper/grandchild shape.

## Provenance

EPIC-16 §L1's deferred retirement, filed now that [[REQ-318]] and [[REQ-319]] have
landed, plus the correction §L1's sequencing left behind. Occasion: EPIC-19
Finding 12, where the operator lost a turn to a merge-triggered restart while
believing he was on the frozen environment.
