---
uid: report-f07da2ac
id: REPORT-2546
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 34'
created_by: xgd
created_at: '2026-08-20T21:49:43.650580+00:00'
updated_at: '2026-08-20T21:49:43.650580+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 1
  progress_made: true
  needs_more_work: false
  violations_remaining: 1
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 34
**Fixes applied this call**: 1
**Violations remaining**: 1
**Needs more work**: false

## What was re-derived this call (not inherited from report-d302bbd2)

| Check | Command | Result |
|---|---|---|
| Divergence | `git rev-list --count HEAD..main` | **531** (was 528 last pass — `main` gained 3 more) |
| Last non-`.xgd` commit here | `git log -3 --format='%h %ci %s' -- . ':(exclude).xgd'` | `fb283f48b`, 2026-08-20 07:53:10 — unchanged across attempts 1–33 |
| Store modules here | `git ls-files tools/generate/src/store` | **8** |
| Store modules on `main` | `git ls-tree main --name-only tools/generate/src/store/` | **14** — the 6 the ACs describe (`site-store`, `fs-store`, `memory-store`, `assemble`, `journal-model`, `journal`) exist only there |
| `fsSiteStore` anywhere here | `git grep -an "fsSiteStore" -- tools packages apps tests` | **zero hits** |
| Workers-routed files here | `git ls-files \| grep -c "workers.test.ts"` | **0**; `vitest.config.mts` is the only config |
| ACs on this story | `xgd ticket list --type acceptance_criterion --view --flags frontmatter,fields --limit 5000` | **11**, all `active`, all `uat_coverage` unset |

Finding 3 stands, re-verified: the capability's production code is absent from the tree under
check. Neither AC-1353's nor AC-1354's UAT can be authored here — not "should not", *cannot*: the
modules they read and the symbol they count do not exist on this branch.

**Info-5 independently confirmed** (I did not take it on the report's word). Read from `main`'s
blob directly:
- `tools/generate/src/cli/ai/toolbox.ts` — `new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })`.
  `store:` is written **after** the spread, so an injected `opts.store` is silently discarded.
- `l1Operations(slug, opts)` is exported separately, with a docstring stating it is exported that
  way "because it is the whole of this surface's behaviour and it is worth being able to exercise
  it without a runtime import of the AI library."

**Finding 2 re-checked at source, and the assessor is right.** I read
`main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts` in full. AC-1353's substance is
genuinely covered — all three of its bullets, including the third (`edit.ts` is asserted not to
import the `../store` barrel, and `main:tools/generate/src/store/index.ts` carries the matching
"THIS BARREL IS NODE-ONLY" contract). The defect is the case *names* only. I did **not** manufacture
an AC-body edit to paper over a test-naming problem on another branch.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | `ac-edit` | AC-1354 (`acceptance_criterion-56798f01`) | Rewrote the **Verification** clause. Criterion preserved verbatim. |

### Why this edit, and why it is not manufactured progress

AC-1354's Verification clause previously read, in whole, "drive the assistant's tool adapter end
to end against an injected store." Taken at face value that instruction routes an author through
`createL1Toolbox`, which — verified above — **cannot** take an injected store. The resulting test
passes while running on the operator's filesystem: a false green on the one criterion whose point
is that no filesystem is reached. A Verification clause that cannot be performed as written is a
form defect in the criterion, and correcting form while preserving intent is squarely the editor's
mandate.

The revised clause now: (a) separates the structural half (the filesystem adapter constructed
exactly once in each of the three entry-point modules, nowhere beneath them) from the behavioural
half; (b) directs the author to bind the separately-exported operations against an injected store
rather than the toolbox construction helper; and (c) states explicitly that the helper's override
is *intended* behaviour at that entry point — it is where the adapter is named once, as the
criterion requires — **so it must not be misfiled as a `code-issue`**. That last sentence closes
the second trap info-5 named.

This is durable. AC-1354 exists only on this branch (`git ls-tree main .xgd/tickets/hot/` finds
`d4cc3712` but not `56798f01`), so the correction travels with it whenever the branch reconciles,
and it lands *before* anyone writes the test rather than after they have written a passing wrong
one.

## Code Edits

None. No production file on this branch is implicated, and none could be — the implicated files
are not on it.

## Violations Remaining

1 — **AC-1354 has no UAT.** Unchanged by this call and unchangeable on this branch. The criterion
is now specified correctly enough that the test can be written in one pass; the test itself is
`main` work.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| All 11 ACs / `capability-c4c7a854` (finding 3) | The capability under check is not present in the tree under check. `regression-cb0dad9c` was cut at `0f44ef1ba`; REQ-141/REQ-142 landed on `main` afterwards, now **531** commits ahead. Zero of 11 ACs are verifiable here. | Either (a) re-cut or refresh this regression branch from current `main`, or (b) exclude `capability-c4c7a854` from this regression run. Authoring the UATs here would require porting REQ-141/REQ-142 production code onto a regression branch — feature work in the one place it must not happen. |
| AC-1353 (`003caa07`), finding 2 — `uat-edit` | Substance proven on `main`; the two cases are named `UAT_FC_REQ-142 …` and bound to the AC only by a section comment, so `test_UAT_AC{number}_` traceability resolves AC-1353 to nothing. | Rename the two cases to `test_UAT_AC1353_*` **on `main`**. Target file absent here. Traceability only; the evidence is already correct. |
| AC-1354 (`56798f01`), finding 1 — `uat-add` | No UAT on `main` and none here. | Author `test_UAT_AC1354_*` **on `main`**, against the now-corrected Verification clause. No production change needed — the four `fsSiteStore(` sites on `main` already match the claim. |

## Why `needs_more_work = false`

Per the loop rubric, `false` means "you have addressed all violations you can meaningfully address
(the assessor will verify)." That is exactly the state: the one lever this branch affords — the
ticket store — has been pulled where it was justified, and no further edit to a ticket, a test or
a source file *on this branch* moves the remaining violation. Declaring `true` would assert a plan
for attempt 35 that does not exist; attempts 1–33 each reached this same wall and applied zero
mutations, and nothing about elapsed attempts changes the inputs.

Per the failure/error taxonomy in `CLAUDE.md`, this is a **terminal failure** — an expected dead
end with no fix-loop path by construction — and the repeated `@fail` → `fix_uat_validation` →
`@fail` cycle is the symptom of it being routed as a recoverable failure instead. It needs an
operator decision (re-cut or exclude), not another iteration.

**Note for whoever settles the branch question:** re-cutting is necessary but not sufficient. Even
a branch carrying all of `main`'s tests still fails this check on AC-1354, because that UAT exists
nowhere. Closing this capability's uat level needs both (a) the branch to see the code and (b)
`test_UAT_AC1354_*` authored on `main`.
