---
uid: bug-5c3e65f6
id: BUG-150
type: bug
title: bin/dev up starts the watching builder, not the frozen snapshot it just built
  — and every server that reads the changing tree should be deleted
created_by: EPIC-19
created_at: '2026-09-25T23:26:01.085217+00:00'
updated_at: '2026-09-26T20:34:42.318670+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-e4a9f6be
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


## Design decisions taken while implementing

**The snapshot servers are one command with an app argument.** `1c dev serve`
took no argument and hard-coded `control-app`; the public site needs the same
thing against its own `.dev-snapshot/`, and a second command would be a second
author of the same launch. It is now `1c dev serve [<app>]`, defaulting to
`control-app`, driven by a `DEV_SERVE_APPS` table in `dev-snapshot.ts` that
declares — per app — its port, whether it reads the `.dev.vars` layering, and
whether starting it checks the local D1 against `db/migrations/`.

- **Only the control app reads the layering.** `devEnvLayering` is about
  `ANTHROPIC_API_KEY` and the two Access vars; the public site has no
  `.dev.vars` and never did. Passing `--env-file` for it would replace
  wrangler's own `.dev.vars` lookup with a list of files that do not exist and
  print three warnings about a builder it is not.
- **Only the control app checks the store.** `localD1Check` reads
  `apps/control-app/wrangler.toml` and `db/migrations/`; the public site's own
  config declares no `migrations_dir` on purpose — *"migrations belong to the
  database and are applied once, by the Worker that owns the schema"*. `up`
  starts the control app first, so the check still runs exactly once.

**The public-site snapshot takes 8787 — the port `pnpm dev:public` is being
deleted from.** The alternative, a sixth number, would leave the port the
operator already associates with the public site owned by nothing while the
public site ran somewhere else. Reusing it means habit and old shell history
land on the frozen server rather than on nothing. The control app's snapshot
keeps 8789, which `bin/access-sim` already defaults to (REQ-322).

**8788 keeps a `1c ps` row, naming itself as retired.** Deleting the row would
make a leftover builder — one started before this landed, or from a torn-down
worktree — the unnamed stray this whole mechanism exists to stop. It is a row
that says what to do about it, not an entry point: nothing starts it and
`bin/dev up builder` is now an error naming the services that exist.

**Both ports move into `dev-snapshot.ts` and `ps.ts` imports them.**
`KNOWN_SERVICES` already says its numbers "have no constant to import — 8788 is
a literal in this CLI's `builder` case, 8787 lives in the public site's package
script". This ticket deletes both of those homes, so the table that declares
what a port MEANS now also declares the two numbers this ticket owns, the way
it already imports `DEFAULT_FILING_PORT`.

**`bin/dev up` reports the snapshot per served app, including one it did not
start.** The failure is *"he had no way to know what he was running"*, and the
case where something was already answering on the port is precisely where that
is least knowable. So `up` prints the manifest for every snapshot app in the
selection and marks the already-answering case as describing the snapshot on
disk rather than necessarily what that process loaded. An app with no snapshot
at all is named too, with the deploy command to run — silence there would be the
same defect in a new place.

**`1c builder --remote` goes with the builder.** It pointed `wrangler dev` at
the deployed D1 and R2 from a laptop, and it is not a capability the frozen
environment has or should grow: the snapshot exists to be the local store's
server. Nothing replaces it in this ticket.

**`concurrently` stays in `devDependencies`.** The root `dev` script was its
only caller and is deleted, but removing the dependency without regenerating
`pnpm-lock.yaml` breaks `pnpm install --frozen-lockfile`. Flagged for the
operator rather than half-done.

## Acceptance criteria this supersedes

Both were written to pin the side-by-side period EPIC-16 §L1 required, and both
say in their own comments that retirement is a later ticket. This is that ticket,
so they are replaced by their inverse rather than kept:

- `test_UAT_FC_REQ-318_the_old_path_is_untouched_and_binds_a_different_port` —
  asserted `scripts.dev` contains `dev:public`, that `dev:control` is
  `./bin/1c builder`, and that `wranglerDevArgs` still composes a watching argv.
  Replaced by the assertion that none of those exist.
- `test_UAT_FC_REQ-322_up_starts_both_servers_in_dependency_order` and
  `…_up_records_all_five_and_down_frees_them` — pinned a five-row
  `DEV_SERVICES` table containing `builder`. Replaced by the four-row table, with
  the ordering and pidfile claims carried over unchanged.

`wranglerDevArgs` is deleted from `dev-env.ts`: with the builder gone nothing
composes a `wrangler dev` over `src/`, and a function whose only job is to build
that command line is the thing an agent resurrects. The BUG-124 and BUG-146 UATs
that used it as one of two launchers now assert the same layering facts against
`devServeArgs`, which is the surviving launcher and reuses the same layering.


## Adjustments made while implementing

**`1c dev serve`'s refusal carries the app list in the message, not a `hint`.**
The first draft used `CommandError.hint`; a UAT ran the real CLI and showed the
hint never arrives — `bin/1c.mjs` prints `err.message` and nothing else, which
`reset.ts` already records about its own refusal. The known apps and their ports
are in the message.

**`1c reset --port` defaulted to 8788 and now defaults to 8789.** The guard is
"is something holding the store's SQLite files open" — it named the builder's
port, and a guard whose default names a port nothing binds always passes.

**`LOCAL_ORIGIN` moves with it.** `bin/copy-to-cloud` / `bin/copy-from-cloud`
defaulted `--origin` to `http://localhost:8788`, which is now nobody's.

**`builder` leaves `WORKERD_GATED_COMMANDS`.** It headed that list because it
opened `.wrangler/state`, which the first `workerd` to open migrates forward
silently and one-way. Deleting it un-gates nothing: `dev up`, `dev restart` and
`dev serve` are all still there, and a UAT pins that.

**Docs updated to name the surviving path**: `bin/dev`'s header, `bin/deploy`'s
usage and its closing "now serve it" line, `bin/access-sim`'s recipe, and
`apps/control-app/ACCESS.md`'s hand-run recipe — which told the operator to
start `wrangler dev --port 8788` by hand.

**One pre-existing failure fixed in passing.** `test_UAT_FC_BUG-50_*` expected
two `--env-file` arguments; [[BUG-146]] added `.dev.vars.local` as a third and
this expectation was never moved, so it had been failing on `xgd-working`. Two
assertions corrected while the suite was being repointed at the surviving
launcher.


## Further acceptance criteria this supersedes

Found by running the suites, not by reading them: two more UATs asserted the
deleted command as their entry point, and both are repointed at the surviving one
rather than deleted, because what they pin is still true and still worth pinning.

**`test_UAT_FC_REQ-253_*` — the store check's entry point moved.** REQ-253 is the
gate that refuses to start a server against a database behind `db/migrations/`,
and six of its eleven legs drove it through `run(['builder'])`. `1c builder` is
deleted and the store is now opened by `1c dev serve`, so they drive that. Three
consequences, each asserted:

- **The environment being read changed.** `dev serve` runs at `--env dev`, which
  inherits nothing, so the block deciding which database file is opened is
  `[[env.dev.d1_databases]]` rather than the top level `wrangler dev` read. The
  fixture now declares all three blocks — top level, `[env.dev]`, `[env.production]`
  — with `[env.production]` naming a different id, so a check reading any block
  but the served one fails.
- **The remedy sentence changed with it, and was already correct.** `refusal()`
  has been environment-aware since REQ-318: at a named environment it says
  `bin/deploy --env dev`, because that is where the hook verifying an applied
  migration's bytes lives ([[REQ-291]]), and a bare `wrangler d1 migrations apply`
  would go round it. The UATs asserted the `--local` form because the builder
  served the top level. They now assert the deploy at the entry point, and the
  `--local` form at `localD1Check` itself — no command serves the top level any
  more, and two environments have two true sentences.
- **A snapshot has to exist for the check to be reached at all.** `dev serve`
  refuses on a missing snapshot before it looks at the store, so the fixture
  writes the manifest `bin/deploy --env dev` would have written. Nothing
  re-derives it.

`test_UAT_FC_REQ-253_remote_is_not_gated_on_the_local_store` is replaced by its
inverse, `…_the_check_has_no_ungated_mode_to_be_bypassed_through`. It pinned
`1c builder --remote` — wrangler pointed at the deployed database, which the local
store says nothing about, so refusing on the local store would have blocked the
one mode the check had no evidence for. `--remote` went with the builder, as
recorded above, so there is no longer a mode the gate must step aside for. That
makes the surviving claim the stronger one: nothing reaches `wrangler dev` through
`dev serve` without passing the check, asserted on the argv so a reintroduced
`--remote` cannot silently re-open the hole.

**`test_UAT_FC_REQ-177_help_advertises_no_raw_server`.** REQ-177 discontinued
`1c serve`, a raw `node:http` origin, and pinned that the help offers a
`wrangler dev` instead — naming `1c builder` as that instead. The claim is
unchanged; only which command satisfies it. It now asserts `1c dev … serve` and,
additionally, that `1c builder` is not still on offer beside it.

## Prose corrected where it made a false claim

`test_UAT_FC_BUG-147_*`'s header said the wrapper/grandchild shape belonged to
`1c builder` and that it was two of the four services. The shape is `wrangler dev`
forking `workerd`, which is exactly what the two snapshot servers do — so the
comments name the arrangement and record the builder as where it was measured.
This is the ticket's own boundary being honoured: BUG-147 must not regress, and
its fixture builds the shape rather than naming it, so no assertion changed.
