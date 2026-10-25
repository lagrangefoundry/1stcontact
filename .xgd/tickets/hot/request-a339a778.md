---
uid: request-a339a778
id: REQ-316
type: request
title: 'Exactly one workerd: pin wrangler and miniflare together, and check it'
created_by: EPIC-16
created_at: '2026-09-24T19:08:41.228133+00:00'
updated_at: '2026-09-25T00:34:51.397678+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  needs_review: false
  auto_merge_back: true
  epic_parent: epic-96d8aca6
  chat_comment: comment-e7cff699
  commits:
  - working_sha: bc07664b9d404cb4d5f4cc0176138a68a267b607
    reconcile_sha: null
    main_sha: null
  version: 0.2.349
  story_points: 3
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


---

## What landed

Commit `bc07664b9d` (`0.2.348 → 0.2.349`).

### 1. Exact pins, in four manifests and in the lockfile

`wrangler` → `4.111.0` and `miniflare` → `4.20260710.0`, caret removed, in root
`package.json`, `apps/control-app`, `apps/public-site` and `tools/generate`. The
2026-09-24 resolution the ticket records as "already applied" was uncommitted in the
operator's working tree; it is carried forward here as part of the pin, together with
`pnpm-workspace.yaml`'s `minimumReleaseAgeExclude` entries and the re-resolved
`pnpm-lock.yaml`.

**The lockfile's own `specifier:` lines were pinned too**, not just the manifests. The
manifest is what a human edits; the lockfile is what `pnpm install --frozen-lockfile`
enforces, so a pinned manifest whose lockfile still records a caret is a pin no install
has ever been asked to honour. A UAT asserts both.

**Consequence: `pnpm install` must run after this lands.** Changing a specifier makes
`node_modules` lag the committed lockfile, which is exactly [[REQ-44]]'s `lockfile-drift`
finding — so until an install runs, `1c capture` / `shot` / `diff` / `gate` /
`aligned-crops` / `values-diff` / `adopt-gaps` refuse with exit 6. Reported honestly by
the existing preflight rather than worked around.

### 2. `tools/generate/src/cli/workerd.ts` — the third preflight

The shape the ticket asks for, beside [[REQ-44]]'s and [[REQ-144]]'s: a pure
`checkWorkerd(opts)` returning a `WorkerdReport`, an `assertOneWorkerd(command, opts)`
throwing `CommandError` with `EXIT_CODES.ENVIRONMENT` (exit 6), and an injectable
`scan` seam so the suite never mutates a real `node_modules`.

**It reads the installed tree, not the lockfile.** The lockfile says what *should* be on
disk; a virtual store keeps orphaned versions long after nothing links them. `scanWorkerd`
walks the resolution graph breadth-first from every workspace importer, so a
`workerd@…` directory surviving in `node_modules/.pnpm` with no dependant is correctly
not a finding — it is not a runtime anything can reach. [[REQ-44]] owns the other half.

**The unit of the walk is a `node_modules` directory, not a package directory.** pnpm
parks a dependency BESIDE its dependant — `wrangler` and the `workerd` it declares both
sit in `.pnpm/wrangler@<v>/node_modules/`, and Node finds the second by walking up out of
the first. A first implementation looked under `wrangler/node_modules` and found nothing
at all, which reads exactly like a clean tree: the loudest possible way to be wrong, since
silence is what success looks like. The nested npm/yarn layout is followed too, and a UAT
covers each.

**Workspace importers are discovered, not listed** — read from `pnpm-workspace.yaml`'s
`packages:` globs, so a fifth workspace package that starts declaring a runtime is covered
by existing rather than by someone remembering to extend a constant. Deliberately a
few lines of line-matching and not a YAML parser: a dependency bought for one list of
globs, in a module whose whole subject is dependencies that were not worth their cost.

**Zero copies is not a finding.** "Exactly one" is the invariant, but a tree with no
`workerd` at all is an *uninstalled* tree, which [[REQ-44]] already reports exactly. Two
checks refusing the same tree for different reasons is how an operator comes to fix the
wrong one first.

#### What the refusal says

A split shows up on more rows than an operator can edit — `wrangler` carries its own
`miniflare`, and `@cloudflare/unenv-preset` takes `workerd` as a peer. Every row is
reported (dropping them would hide that both generations are genuinely live), grouped by
version, with the editable ones first and annotated with the manifests that declare them:

```
ENVIRONMENT: '1c reset' cannot run: 2 versions of `workerd` resolve in this tree.
  - workerd 1.20260630.1 — brought by miniflare@4.20260630.0, declared in package.json, tools/generate/package.json
  - workerd 1.20260630.1 — brought by wrangler@4.106.0, declared in package.json, apps/control-app/package.json, apps/public-site/package.json
  - workerd 1.20260630.1 — brought by @cloudflare/unenv-preset@2.16.1
  - workerd 1.20260710.1 — brought by miniflare@4.20260710.0, declared in package.json, tools/generate/package.json
  - workerd 1.20260710.1 — brought by wrangler@4.111.0, declared in package.json, apps/control-app/package.json, apps/public-site/package.json
  - workerd 1.20260710.1 — brought by @cloudflare/unenv-preset@2.16.1
`.wrangler/state` is workerd's own store and workerd migrates that schema forward
silently the first time it opens it. […] there is no supported way back.
  hint: Pin `wrangler` and `miniflare` to exact versions that agree on one workerd.
  They are declared in package.json, apps/control-app/package.json,
  apps/public-site/package.json, tools/generate/package.json. Then run `pnpm install`
  and retry.
```

That is not a constructed example: it is the real output, captured from the free-REQ-316
worktree, whose `node_modules` happened to hold exactly the 2026-09-24 skew.

#### Where it is gated

At dispatch, immediately after [[REQ-44]]'s `assertInstall` and before the `switch`, so
the refusal arrives before anything opens the store — the migration is effectively one-way,
and a check that fires afterwards has watched the damage happen. Ordered after
`assertInstall` because an uninstalled tree resolves no workerd at all and should be told
to install first.

`WORKERD_GATED_COMMANDS` is `builder`, `reset`, `fonts seed`, `fonts mirror`.
`fonts` is keyed WITH its subcommand (`workerdGateKey(command, rest[0])`) because only two
of its seven open a store — `seed` writes the local R2 bucket and `mirror` seeds at its
tail ([[REQ-315]]) — while `check`, `catalogue`, `doc`, `index` and `publish` read files or
talk to the R2 REST API. Verified end to end against the real CLI in the skewed worktree:
`1c reset` and `1c fonts seed` exited 6 with the table above; `1c fonts check` and
`1c fonts doc` exited 0 in the same tree.

### 3. `fonts/seed.ts`'s header, corrected

The quoted claim — *"declaring it only makes an existing fact importable"* — is replaced
with what declaring it actually created (a second, independently floating resolution), why
the dependency cannot be removed (wrangler's `exports` map does not expose `Miniflare`),
and what now constrains it (exact pins plus `cli/workerd.ts`).

## Test plan — as implemented

`tests/test_UAT_FC_REQ-316_one_workerd.test.ts`, 16 UATs against synthetic `node_modules`
trees and the live checkout.

*The declaration:* every manifest declares both packages exactly; no workspace manifest
floats `wrangler`, `miniflare` or `workerd`; the lockfile records exact specifiers.

*The check:* one runtime passes silently for every gated command; two are named with what
brought each; transitive bringers are reported but carry no manifest; the refusal names
every version, its bringer, the manifests and `pnpm install`, and travels `ENVIRONMENT`/6;
an orphaned store version is not a finding; an uninstalled tree is left to [[REQ-44]]; the
gate refuses the four store-openers and never the file-only verbs; the subcommand selects
the gate for `fonts`; workspace packages are discovered from `pnpm-workspace.yaml`; both
the pnpm sibling and the nested npm layout are walked; and the gate is wired into the
dispatch preamble rather than into three command bodies.

*This checkout:* one last UAT asserts the invariant against the tree the suite runs in —
the thing nothing asserted on 2026-09-24. It is `skipIf`-gated at collection on
[[REQ-44]]'s own drift signal, because a `node_modules` that lags its lockfile has no
settled resolution to be right or wrong about.

Regression scope run green: `req44-install-preflight`, `reconciliation-1c-install-preflight`,
`test_UAT_FC_REQ-144_deploy_scripts`, `test_UAT_FC_REQ-315_font_mirror_dev_target`,
`test_UAT_FC_REQ-253_dev_server_refuses_a_stale_database`, `generate`,
`reconciliation-1c-cli-output-hygiene`, `reconciliation-1c-aligned-crops-sandbox-routing`,
`naming`, `ci-workflow`, `deploy-workflow`, `public-site`. `tsc --noEmit` clean for
`tools/generate`.