---
uid: report-08b56a7e
id: REPORT-3957
type: report
title: 'Fix reconciliation review: bundle-87be4669'
created_by: xgd
created_at: '2026-09-11T07:50:08.635806+00:00'
updated_at: '2026-09-11T07:50:08.635806+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-87be4669
  needs_more_work: true
  progress_made: true
---

## Stories created

None. The review's load-bearing instruction — for the third consecutive cycle —
is that Steps 4 and 6 pass and the stories, ACs and UATs are correct. No matrix
ticket was created, modified or deleted this call.

## Stories modified

None. (See above.)

## Stories deleted

None. (See above.)

## FC orphans renamed/deleted

None, and none are outstanding. No `fc_orphan_check` report exists for
`bundle-87be4669` at all, so category 3 does not apply this call. Confirmed
directly as well: every `test_UAT_FC_*` file on disk belongs to BUG-34..39 or
REQ-122..154/162 — none to this bundle's seven intents (REQ-158, 159, 161, 163,
164, 165, 167).

## Code changes

**`tools/generate/src/cli/ai/host-core.ts`** — migrated the caretaker role off
three upstream fields that no longer exist, which is review action 2's first
half and the bundle's one *failing* (as opposed to *unrunnable*) criterion.

Cause, verified in the installed shared store rather than inferred:
`@lagrangefoundry/ai`'s `Role` is now `Object.freeze(this)` (`src/roles.js:404`)
and its constructor accepts `{name, priming, reminders, tools, permissions,
sandbox, cacheBoundary}` — `system`, `source` and `reminder` are gone, so all
three were being **silently dropped**, and `streamPrompt`'s per-turn
`role.reminder = …` was **throwing on every turn**. The assistant was not
degraded, it was non-functional.

What changed:

- `system` → a static priming `Entry` (`caretaker.system`).
- `source` (the `ContextSource` from `deps.priming`) → a priming `Entry` backed
  by a `caretaker.docs` provider that joins `documents()` at call time. The
  `HostDeps.priming` seam is untouched, so `host.ts` and
  `apps/control-app/src/system-knowledge.ts` need no change and the "one
  document" property AC-1319 asserts on is preserved.
- `reminder` → a `caretaker.reminder` provider. It is the same comparison that
  was in `streamPrompt`, moved to where upstream now runs it ("a host that wants
  per-turn reminder text writes a reminder *provider*", `roles.js:365`). The
  counter read moved with it; `streamPrompt` keeps only the `finally` that
  records the post-turn baseline, which genuinely belongs to the caller.
- Providers are registered on `manager.providers` **after** construction rather
  than passed as `opts.providers`, because upstream defaults the shipped product
  tier and the tool-transcript pointer's reader only when neither `product` nor
  `providers` is supplied (`manager.js:170-182`). Passing a registry would have
  silently traded both away.

One file, +97/−50, no public signature changed.

**Verification** (targeted runs only — the workflow runs the full suite next):

- `test_UAT_AC1320_an_unbuilt_kb_is_silent_and_an_unopenable_one_is_reported` —
  **was failing, now passes.**
- `test_UAT_FC_BUG-39_the_shared_double_is_consumed_by_the_real_backend` — was
  failing on the same throw, now passes.
- Regression scope, 13 further suites across the host, builder panes, library
  tab and upload overlay: **no suite regressed**; 21 passing tests in the final
  run, 51 in the wider adjacent run.
- `tsc -p tools/generate/tsconfig.json --noEmit`: the edit introduces **zero**
  new type errors. The five that remain are the two pre-existing faults below.

## What I did NOT do, and why

The review named four required actions. One was actionable here; three are not,
and each was verified rather than assumed.

**Action 1 — refresh the worktree's dependencies (24 ACs). Not possible here,
but now cheaper for whoever can.** Verified this call:

- `pnpm view unpdf version` fails `ERR_PNPM_META_FETCH_FAIL … fetch failed`,
  including with `HTTPS_PROXY`/`NODE_USE_ENV_PROXY=1` forced. The sandbox proxy
  refuses `registry.npmjs.org`; there is no network here in any form.
- **New and useful**: both packages ARE already in the machine's pnpm content
  store (`~/Library/pnpm/store/v11/index.db` matches `unpdf` and
  `@anthropic-ai/sdk`). So the operator does **not** need network — a plain
  `pnpm install --offline` on a TTY should resolve it. The review's "no network
  to restore it" caveat is weaker than it looked.
- I did **not** force the install. Auto-confirming
  `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` purges `node_modules` before
  reinstalling, and a prior session in this sandbox has already hit a hard OS
  denial partway through a pnpm install (a `.idea` directory inside
  `iconv-lite`), which would have left the tree half-installed. That trades the
  25 criteria that currently pass for the 24 that do not — against the review's
  own explicit judgment. Deliberately declined.
- Correction to the review's count: **five** node suites are blocked by this,
  not four. `reconciliation-palette-popup-surface` fails to collect for the same
  reason (`Failed to resolve import "@anthropic-ai/sdk" from
  apps/control-app/src/describe.ts`).
- I also declined to make `describe.ts`'s imports lazy as a workaround. The
  review correctly classified this as an install-state fault, not a code fault;
  converting a static import to a dynamic bare specifier in Worker-bound code is
  exactly the resolution hazard `sharedModulePath` exists to prevent, and I
  cannot run the workerd build to check it.

**Action 2, second half — `KnowledgeDocs`, and the AC-1318 decision. Blocked on
a decision I do not own, and unfixable without the matrix edits I am forbidden
to make.** AC-1317/1318/1319 are, as the review says, not in this bundle's AC
set. All three are one upstream redesign:

- `@lagrangefoundry/ai-knowledge` **no longer exports `KnowledgeDocs` at all**.
  It is replaced by a provider pair — `landscapeProvider` / `mechanismProvider`,
  registered via `registerKmProviders`. This is a deliberate upstream decision,
  stated in `knowledge/src/priming.js:15-24`: *"KM no longer owns the order …
  Role purpose used to sit between these two sections … That is gone — KM does
  not know roles exist."*
- The consequence is that **AC-1319's `# Your purpose` heading now has no
  upstream producer**, and the "one document whose internal order KM owns" that
  story-a58a0974 and AC-1319 describe is a design upstream has retired. Adopting
  the new model therefore *requires* rewriting that story and AC — precisely
  what this fixer is instructed not to do. That conflict is the operator's to
  resolve, not mine to resolve by quietly editing the matrix.
- `apps/control-app/src/system-knowledge.ts:3` still imports `KnowledgeDocs` and
  is a hard `tsc` error today (TS2305). `tools/generate/src/cli/assets.ts:414`
  still names `'KnowledgeDocs'` in the generated Worker re-export allowlist.
  Both are live breakage in the deployed path.
- **AC-1318 is a genuine product decision and I deliberately left it open**, as
  the review asked. Upstream added `KnowledgeChanges` and `KnowledgeOutline` to
  the `ReadKnowledge` group; the repo grants by *group*, so the caretaker's
  surface widened with no commit in this repo. The tripwire fired exactly as its
  comment promised. Widening the assertion would launder the change; narrowing
  the grant to enumerate three operations is a behaviour change with no ticket.
  Someone with product authority must choose.

**Action 3 — execute the eleven `*.workers.test.ts` suites (95 ACs).** Not
possible: miniflare cannot bind a socket in this sandbox (`listen EPERM
127.0.0.1`). Unchanged by anything in this call, and the review already declined
to hold it against the matrix.

**Action 4 — treat `Scoped quality: pass (0 tests, 0 failed)` as a gate
failure.** This is an instruction to the outer workflow, not a working-tree
change. Nothing here can implement it.

## Confidence

**Low that the next reconciliation_review returns PASS, and the reason is not
the matrix.**

The review's own verdict was FAIL on evidence *execution*, not evidence *design*
and not story fidelity. Of 145 active criteria it could observe only 25 passing;
this call converts exactly one more (AC-1320) from failing to passing and
regresses none. The two large blocks — 95 criteria behind the workerd socket
limit and 24 (really 29 tests across five suites) behind two uninstalled
packages — are environmental and remain exactly as they were, because both
require capabilities this sandbox does not have and the one destructive
workaround available was judged worse than the disease.

`needs_more_work=true` is therefore honest rather than defensive: three of the
four required actions are genuinely outstanding. But re-entering *this* fixer
will not clear them. What is needed next, in order:

1. An operator or runner with a TTY: `pnpm install --offline` (the packages are
   already in the local store). That alone restores ~29 tests and 24 criteria.
2. A socket-capable environment for the eleven workerd suites.
3. A **separate ticket** for the `@lagrangefoundry` framework migration —
   `KnowledgeDocs` → `registerKmProviders`, `system-knowledge.ts`, the
   `assets.ts` export allowlist, and a deliberate ruling on the widened
   `ReadKnowledge` grant. That work necessarily rewrites story-a58a0974 and
   AC-1319, so it must be authorised, not smuggled through a review-fix cycle.
   The shared store is unpinned (`@lagrangefoundry/*` appears in no
   `package.json` and no lockfile), so this class of break will recur until it
   is pinned.
