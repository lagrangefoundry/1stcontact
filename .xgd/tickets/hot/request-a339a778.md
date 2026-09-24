---
uid: request-a339a778
id: REQ-316
type: request
title: 'Exactly one workerd: pin wrangler and miniflare together, and check it'
created_by: EPIC-16
created_at: '2026-09-24T19:08:41.228133+00:00'
updated_at: '2026-09-24T19:08:41.228133+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  needs_review: false
  auto_merge_back: true
  epic_parent: epic-96d8aca6
---

## What broke, on 2026-09-24

`1c builder` died at startup, before serving anything:

```
✘ [ERROR] The Workers runtime failed to start.
  *** Fatal uncaught kj::Exception: workerd/util/sqlite.c++:844: failed: SENTRY_DO SQLite failed;
  dbErrorMessage(prepareResult, db) = table _cf_ALARM has 3 columns but 2 values were supplied
```

`_cf_ALARM` is **workerd's own** bookkeeping table inside each Durable Object's
`metadata.sqlite`. It appears in no schema this repository owns, in no migration, and in
no D1 database. The error names nothing an operator can act on, and the obvious remedies
— `wrangler d1 migrations apply`, a `[[migrations]]` block — are both wrong, because
neither reaches workerd's internal tables.

### The cause, traced

`tools/generate/src/fonts/seed.ts:53` imports `Miniflare` **as a library** and opens
`apps/*/.wrangler/state/v3/r2` at `r2Persist` to write the staged font mirror into the
local bucket ([[REQ-315]]). That is correct and is what the ticket asked for. The defect
is in how the dependency is declared:

| declared | resolved | brought workerd |
|---|---|---|
| `wrangler ^4.106.0` (root, control-app, public-site) | 4.106.0 | **1.20260630.1** |
| `miniflare ^4.20260630.0` (root, tools/generate) | **4.20260710.0** | **1.20260710.1** |

Two independent ranges, each dragging its own `workerd`, and they floated apart —
miniflare's range resolved up a generation while wrangler's did not. The newer workerd
ran `ALTER TABLE _cf_ALARM ADD COLUMN actor_name TEXT` on the R2 stores of both apps when
`1c fonts seed` ran; the older one crashed on them at the next `1c builder`.

**The schema of `.wrangler/state` is owned by `workerd`, and workerd migrates it forward
silently on open.** There is no log line, no warning, and no version stamp an operator can
read. The failure surfaces later, in a different command, naming an internal table.

### The seeder's own header records the assumption that broke

> *"Miniflare is not a new dependency in the tree — it is what `wrangler` already is
> underneath; declaring it only makes an existing fact importable."*

True of the code, false of the resolution. Declaring it created a **second, independently
floating** resolution of the same runtime. That comment should be corrected as part of
this work rather than left asserting something the lockfile can contradict.

### It cannot be fixed by not declaring miniflare

Checked, so it is not re-attempted: wrangler's `exports` map is `"."`,
`"./experimental-config"` and `"./package.json"` only. `Miniflare` appears in wrangler's
type declarations but is **not a public export**, so there is no supported way to reach it
through wrangler. The separate dependency is unavoidable and the fix must therefore be a
constraint, not a removal.

## What is asked for

**The invariant is one sentence: exactly one `workerd` resolves in this tree.** It is
currently true — `wrangler 4.111.0` and `miniflare 4.20260710.0` both pull
`workerd 1.20260710.1` — but only because it was set by hand on 2026-09-24. Nothing
asserts it, so the next `pnpm update`, transitive bump, or fresh install on another
machine can split it again.

Two parts, and the second is the one that earns its keep.

### 1. Pin exactly, so the two move only together

`wrangler` and `miniflare` are declared with `^` in four manifests — root `package.json`,
`apps/control-app`, `apps/public-site`, `tools/generate`. A caret on each lets them drift
independently, which is precisely what happened.

Pin both to exact versions, so a bump is a deliberate, reviewable edit that moves them as
a pair rather than a resolution that happens overnight. This is a smaller claim than it
sounds: it converts floating into manual, and manual is not yet safe — which is what
part 2 is for.

### 2. A third preflight, in the family that already exists

This repository has already solved this shape of problem twice, and the new check belongs
beside them rather than in a new mechanism:

- `tools/generate/src/cli/preflight.ts` ([[REQ-44]]) — *"is this tree installed at its
  lockfile?"*
- `tools/generate/src/cli/shared-store.ts` ([[REQ-144]]) — *"are the shared store's
  components present?"*, whose header states the governing rule: **fail at build time,
  naming the component and the command that fixes it**, rather than let the fault reach a
  surface where it is unreadable.

The new one answers **"does exactly one `workerd` resolve?"** and follows the same shape:
a pure `check…` returning a report, an `assert…` that throws `CommandError` with
`EXIT_CODES.ENVIRONMENT`, and a resolver seam so the suite never mutates a real
`node_modules`.

#### Behaviour

- **A tree resolving one `workerd` passes**, and the check is silent on success.
- **A tree resolving two or more `workerd` versions refuses**, and the refusal **names
  every version found and which declared dependency brought each one** — because the
  operator's next question is always "which one do I change", and a check that only says
  "mismatch" makes them re-derive the table above by hand.
- **The refusal names the remedy** — the manifests to edit and `pnpm install` — in the
  same voice as [[REQ-44]]'s and [[REQ-144]]'s.
- **The refusal arrives before the store is opened**, not after. A check that fires once
  workerd has already ALTERed the store has watched the damage happen.
- **Gating is scoped to the commands that open `.wrangler/state`** — at minimum
  `1c builder`, `1c fonts seed` and `1c reset`. A command that never touches the local
  store is never blocked by a skew it cannot cause, which is [[REQ-44]]'s
  `COMMAND_DEPS` rule and the reason its gate is per-command rather than global.

### Why not `overrides`

Recorded because it is the obvious one-line answer and it is worse. A pnpm `overrides`
entry pinning `workerd` would force every consumer onto one build regardless of who asked
— including overruling wrangler's own pin, so the repository would be running wrangler
against a runtime its authors did not ship it with. That trades a visible failure for an
invisible one. There are no `overrides` or `resolutions` anywhere in the repository today
(`pnpm.overrides` is unset, `pnpm-workspace.yaml` has none), so this would also be a new
mechanism introduced for a problem a check reports better.

## Why this is a precondition of [[EPIC-16]] §K, not hygiene

§K commits to **one** local dev environment whose store is `.wrangler/state`, reached by
running a deploy, and §K2 records the operator's decision that it holds **the only copy**
of the dev data — there is no second store and no seeding fork.

§K's `bin/dev up` then puts **three different kinds of consumer** on that one store:

- `wrangler dev` for builder and public-site — workerd via wrangler's pin;
- `1c fonts seed` — workerd via its **own** `miniflare`;
- `@cloudflare/vitest-pool-workers` in tests — workerd via **its own** bundled wrangler.

That is exactly the configuration that failed on 2026-09-24, and §K makes it the normal
one rather than an accident.

**The migration is effectively one-way.** workerd does not remove the column it added. For
this one table a hand-run `ALTER TABLE _cf_ALARM DROP COLUMN actor_name` is possible, but
that is hand-editing an internal schema on a guess about what the older binary expects,
not a recovery procedure to depend on.

Set that against §K2's single copy and the cost is not an annoyance. Recovery on
2026-09-24 was free **only because of which table workerd happened to change**: the two
poisoned `metadata.sqlite` files held `_cf_ALARM` and nothing else, with zero rows, so
they could be deleted outright and regenerated. The same skew landing on `_mf_objects`
would have cost 6,904 objects and ~2 GB of blobs with no undo.

So §K owes its store a guard **on entry** — `bin/dev up` refusing to start when more than
one `workerd` resolves — rather than trusting the lockfile to stay honest. This ticket
builds the check that guard calls.

## Out of scope

- **§K itself** — the local deploy target and the `bin/dev up/down/reap` supervisor are
  their own tickets. This one supplies a check they consume; it does not presume them, and
  the check must be useful before they exist.
- **The version bump of 2026-09-24** — already applied (`wrangler 4.111.0`,
  `miniflare 4.20260710.0`, `workerd 1.20260710.1`, lockfile re-resolved). This ticket
  keeps it from silently coming undone; it does not redo it.
- **[[REQ-315]]'s seeding behaviour** — the mirror, the key function, the per-app store
  discovery and the served-bytes acceptance are all settled there and are not reopened.
  Only the dependency declaration and the header comment quoted above are touched.
- **Recovering a store that has already been migrated forward.** There is no supported
  downgrade. The check exists so the situation does not arise.
