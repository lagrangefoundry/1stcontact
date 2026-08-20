---
uid: report-485cbb0c
id: REPORT-2508
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 17'
created_by: xgd
created_at: '2026-08-20T19:20:20.931429+00:00'
updated_at: '2026-08-20T19:20:20.931429+00:00'
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

**Attempt**: 17
**Fixes applied this call**: 0
**Violations remaining**: 5
**Needs more work**: true (blocked — not deferred on merits)

## Outcome

Zero mutations, for the fourteenth consecutive fix loop. This is **not** an
acceptance of the findings as unfixable on their merits: all eight actionable
findings (1–8) are correct, precise, and I would apply them today if they had
anywhere to land. They do not. Every one is a `uat-add` / `uat-edit` against two
test files that **do not exist on this branch**, asserting properties of six
store modules that **do not exist on this branch**.

## Independent re-verification performed this call

I did not carry finding 9 forward on trust from `report-a6ec4fa7`. I re-derived
the blocking chain from git directly:

| Check | Command | Result |
|---|---|---|
| HEAD | `git rev-parse HEAD` | `ff5ddabb2` — advanced from `dca552a86` since the check ran; **ticket/report commits only** |
| main | `git rev-parse main` | `bda6c9939` — unchanged; top 3 commits are all `xgd(ticket)` bookkeeping |
| store modules @ HEAD | `git ls-tree --name-only HEAD -- tools/generate/src/store/` | 8: `base, diff, fsutil, history, index, loadSite, paths, snapshot` |
| store modules @ main | same, `main` | 14 — the same **plus** `assemble, fs-store, journal, journal-model, memory-store, site-store` |
| port tests @ HEAD | `git ls-tree -r --name-only HEAD -- tests` | no `reconciliation-site-storage-port*`, **no `*.workers.test.ts` of any kind**, no `test_UAT_FC_REQ-141_*`, no `test_UAT_FC_REQ-142_*`. Only `req22-storage.test.ts` |
| fixture helpers @ HEAD | `git ls-tree -r --name-only HEAD -- tests/support` | **only** `webui-installed.ts` — `site-factory.ts` and `wrangler-toml.ts` absent |
| `edit.ts` @ HEAD | `git grep -a -n '^import' HEAD -- tools/generate/src/cli/edit.ts` | `node:fs` (`:1`), `node:path` (`:2`), `../store` (`:24`) |

The last row is the one that matters most, and it is worth stating plainly:
**all three of AC-1353's first-bullet prohibitions are genuinely false in this
tree.** Authoring `test_UAT_AC1353_*` here would not merely fail at collection
for want of imports — the property it asserts is *false against this branch's
code*, and correctly so, because the port has not landed here. The same holds
for AC-1354's injected-store claim: `memorySiteStore` has no definition at HEAD.

## Why each available lever was rejected

| Lever | Why not |
|---|---|
| Author the eight UATs in this worktree | Imports six absent store modules and two absent fixture helpers → red at collection on two counts, *and* AC-1353/1354 assert properties that are false here. Adds a knowingly-red suite to the branch whose sole purpose is to gate a fast-forward of `xgd-stable` — red against correct code |
| Write the tests into the `main` worktree instead | Unscoped cross-branch change authored from inside a regression run; not this prompt's scope and not a free-coding scope ticket |
| Set `uat_coverage` on the five ACs | That field is owned by `check_uat_coverage` / `fix_uat_coverage`, not this loop. Writing it here manufactures the appearance of progress without evidence |
| `ac-edit` AC-1321/1327/1329/1353/1354 to match the frozen tests | Inverts the source of truth. The assessor's ledger shows the ACs are *right* and the tests are stale — findings 1–5 map one-to-one onto five AC mutations made after the UATs froze at `b18b859d7` |
| Add a third escalation comment | COMMENT-1347 and COMMENT-1354 already carry this escalation verbatim. I re-checked the comment stream this call: every comment on the capability is assistant-authored workflow bookkeeping (`"Claude response for …"`); **there is no operator reply**. A third identical comment is a mutation in form only |

I declined the last one deliberately rather than take `progress_made=true` on a
hollow write.

## Actions Taken — by Resolution Category

None. No ticket body, field, or test file was mutated this call.

## Code Edits

None this call. No finding is categorized `code-issue`; the assessor records
explicitly that every claim the ACs make is reachable from code that already
exists on `main`.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (finding 9, repair of findings 1–8) | The port landed on `main` at `2b902ead0` (2026-08-20T12:21:02Z, merged `b18b859d7` 12:49:19Z), **11h38m after** regression `cb0dad9c` was cut at `0f44ef1ba` (2026-08-20T00:43:02Z). The check is sound on this branch; only the repair has nowhere to land | Choose one of (a)/(b)/(c) below. Unanswered since attempt 7 — **ten passes** |

**Options, with the assessor's recommendation, which I concur with after
re-verifying the inputs myself:**

- **(c) — recommended.** Re-run `check_uat_validation` + `fix_uat_validation`
  for `capability-c4c7a854` on a branch at or past `b18b859d7`. A worktree at
  `main` (`bda6c9939`) already exists, so this needs no new branch and no
  resync. All eight findings become actionable immediately, in the assessor's
  stated order: finding 4 (a deletion) first, then 3 and 5, then 1 and 2, with
  warnings 6–8 folded in cheaply once their host tests are open.
- **(b)** Scope `capability-c4c7a854` out of regression `cb0dad9c`. Note this
  only relocates the repair — the check itself runs correctly here and its
  result would stand on any branch.
- **(a)** Resync `regression-cb0dad9c` past `b18b859d7`. Makes the findings
  actionable in place, but changes what the regression is testing mid-run.
  Least attractive.

## Loop-termination signal

Declaring `needs_more_work=true, progress_made=false` — the documented "stuck"
exit. Violations genuinely remain and there is a concrete plan for all eight;
the plan is gated on an operator decision this loop cannot make for itself.

This is the fourteenth consecutive `progress_made=false`. The inputs have not
moved: `main` is unchanged at `bda6c9939` across all seventeen passes, and the
only mutation in this worktree since attempt 16 is ticket/report commits
(`ff5ddabb2` vs `dca552a86`). An eighteenth iteration against this tree will
reproduce this report again. With three attempts left in the budget, the loop
will exhaust it without converging unless an operator picks (a), (b) or (c).
