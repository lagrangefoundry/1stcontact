---
uid: report-4b869b2a
id: REPORT-2502
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 14'
created_by: xgd
created_at: '2026-08-20T18:57:32.384134+00:00'
updated_at: '2026-08-20T18:57:32.384134+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 0
  progress_made: false
  needs_more_work: true
  violations_remaining: 5
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 14
**Fixes applied this call**: 0
**Violations remaining**: 5 (violations) + 3 (warnings) + 1 (needs_review)
**Needs more work**: true
**Progress made**: false — **deliberate loop exit, not a stall**

## Verdict

Zero mutations, for the fourteenth consecutive pass, and — as on the previous
thirteen — that is the correct outcome rather than a failure to act. Every one of
findings 1–8 is `uat-add` / `uat-edit` against two test files that **do not exist
on this branch**, and each would import store modules that also do not exist on
this branch. Finding 9 (`needs_review`) gates all eight and remains unanswered
since attempt 7.

Per the loop-semantics table, `needs_more_work=true` + `progress_made=false`
exits the loop and hands control back. That is the intended signal here: it is
the only lever this prompt has that stops a fifteenth identical pass and puts the
finding-9 decision in front of the operator.

## Re-verification performed this call (from source, not carried forward)

Nothing was taken on trust from REPORT-2501 / report-e0c03d66. Re-derived:

| Check | Command | Result |
|---|---|---|
| HEAD | `git rev-parse HEAD` | `6985b058e` (advanced from `52c38d94c` — ticket commits only) |
| main | `git rev-parse main` | `bda6c9939` — **unchanged across all fifteen observations** |
| merge-base | `git merge-base HEAD main` | `0f44ef1ba` — `main` is not an ancestor of HEAD |
| store modules @ HEAD | `ls tools/generate/src/store` | 8: `base, diff, fsutil, history, index, loadSite, paths, snapshot` |
| store modules @ main | `git ls-tree --name-only main -- tools/generate/src/store/` | 14: the same **plus** `assemble, fs-store, journal-model, journal, memory-store, site-store` |
| target tests @ HEAD | `git ls-tree -r --name-only HEAD -- tests` | **absent**: `reconciliation-site-storage-port.test.ts`, `…workers.test.ts`, `test_UAT_FC_REQ-141/142/144_*`; also absent: `tests/support/site-factory.ts`, `tests/support/wrangler-toml.ts` |
| target tests @ main | `git ls-tree -r --name-only main -- tests` | all of the above **present** |
| AC-1353 prohibitions @ HEAD | `git grep -a -n -E "^import" HEAD -- tools/generate/src/cli/edit.ts` | `:1 node:fs`, `:2 node:path`, `:24 ../store` — all three prohibitions genuinely **false** here |
| operator response | `xgd ticket comments capability-c4c7a854` | COMMENT-1347, COMMENT-1354 only — both `created_by: xgd`, **still no reply** |

Two facts beyond the assessor's ledger, established this pass:

1. **The support helpers are missing too.** `tests/support/site-factory.ts` and
   `tests/support/wrangler-toml.ts` exist on `main` but not at HEAD. So the
   repairs would fail at collection on *two* counts — the six absent store
   modules and the two absent fixture helpers — not one.
2. **AC-1353 would be red against correct code.** `edit.ts` at HEAD legitimately
   imports all three prohibited modules, because this tree predates the port.
   A `test_UAT_AC1353_*` authored here would not be a useful RED — it would
   assert a property the branch is not supposed to have yet.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| — | — | — | **None.** All eight actionable findings are blocked by finding 9. |

Levers considered and rejected, with reasons:

| Lever | Why rejected |
|---|---|
| Author the 2 new + 4 edited UATs here | Import-time failure on 6 absent store modules + 2 absent support helpers; adds a knowingly-red suite to the branch that gates a `xgd-stable` fast-forward. Red against *correct* code. |
| Write into the `main` worktree | Unscoped cross-branch change from a task scoped to `regression-cb0dad9c`. |
| Set `uat_coverage` on the ACs | Not this prompt's field — owned by `check_uat_coverage` / `fix_uat_coverage`. Writing it would manufacture a green signal over absent tests. |
| `ac-edit` the ACs to match the tests that exist | Inverts the source of truth. The assessor explicitly raised **no** `code-issue` and no `ac-edit` against intent: every AC claim is reachable from code that exists on `main`. |
| Add a third escalation comment | COMMENT-1347 and COMMENT-1354 already carry this escalation verbatim and are unanswered. A third is noise, and claiming it as `progress_made=true` would re-arm the non-convergent loop — the exact mechanism finding 9 flags. |

## Code Edits

None this call.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (repair of findings 1–8) | All eight repairs target `tests/reconciliation-site-storage-port.test.ts` / `…workers.test.ts`, absent from this branch. The port landed on `main` at `2b902ead0` (2026-08-20T05:21-07:00, merged `b18b859d7`), **11h38m after** regression `cb0dad9c` was cut at `0f44ef1ba` (2026-08-19T17:43-07:00). | Pick one: **(c)** re-run `check_uat_validation` + `fix_uat_validation` for this capability on a branch at/past `b18b859d7` — a worktree at `main` already exists, so no new branch and no resync needed; **(b)** scope `capability-c4c7a854` out of regression `cb0dad9c` — noting the *check* is sound here, so (b) only relocates the *repair*; **(a)** resync `regression-cb0dad9c` past `b18b859d7`, which changes what the regression tests mid-run. **(c) recommended**, then (b); (a) least attractive. |

## Second item for the operator — the loop mechanism itself

Independent of which of (a)/(b)/(c) is chosen: the inner loop's
`progress_made=false` is being consumed by the outer `fix_uat_validation` →
`check_uat_validation` cycle **without escalating**, which is why fourteen
identical passes have run against an input that has not changed. `main` has not
moved from `bda6c9939` across any of them; the only mutation in this worktree
since attempt 13 is ticket files. This check is deterministic — a fifteenth pass
against this tree reproduces the same 5 + 3 + 1 exactly.

The stuck signal is being raised correctly by this prompt. It is not being acted
on upstream. That is worth an operator's attention as a workflow defect in its
own right, separately from CAP-101.

## Work that is ready to land the moment finding 9 is resolved

Not lost — sequenced, per the assessor's ordering, so whoever picks this up on a
branch at/past `b18b859d7` starts from a plan rather than from the report:

1. **Finding 4** (deletion, do first) — remove `…test.ts:585-590` plus its
   scaffolding (`'Before'` at `:563`, `toContain('Before')` at `:571` collapse to
   a plain `seedWithPalette()`). Stops CAP-85/AC-1033's freshness evidence being
   duplicated inside CAP-101.
2. **Finding 3** — extend the `asked` arrays at `…test.ts:135-143` and `:176-184`
   with `appendChange` / `changesSince` / `pendingChanges` over both backends;
   add all three to the `toBeInstanceOf(Promise)` list at `:144`.
3. **Finding 5** — add to `…test.ts:595` a scan over routed test sources showing
   no behavioural assertion branches on the executing runtime, excluding the
   AC-1328-owned probes by name.
4. **Finding 1** — new `test_UAT_AC1353_*`, lifting the two FC assertions from
   `test_UAT_FC_REQ-142_site_store_port.test.ts:105,115` and adding the missing
   third bullet (`fs-store.ts` the sole filesystem importer, behind its own entry
   point), naming the offender via `expect(source, name)`.
5. **Finding 2** — new `test_UAT_AC1354_*`, driving
   `l1Operations(slug, { store: memorySiteStore() })` (`toolbox.ts:176`, not
   `createL1Toolbox` at `:505` — that one overrides the injected store by design,
   which is what AC-1354 *requires*).
6. **Warnings 6, 7, 8** — cheap once their host tests are open.
