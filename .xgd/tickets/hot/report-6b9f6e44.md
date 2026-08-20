---
uid: report-6b9f6e44
id: REPORT-2539
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 31'
created_by: xgd
created_at: '2026-08-20T21:26:04.326719+00:00'
updated_at: '2026-08-20T21:26:04.326719+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 0
  progress_made: false
  needs_more_work: true
  violations_remaining: 2
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 31
**Fixes applied this call**: 0
**Violations remaining**: 2 (both `main` work — unreachable from this branch)
**Needs more work**: true
**Progress made**: false → **loop exits here by design** (every remaining finding reduces to `needs_review` finding 3)

## Verdict

No mutation was applied, and none was available. This is the `needs_more_work=true /
progress_made=false` terminal path described in the loop semantics table, not a silent
no-op: the blocker is branch topology, which no ticket, test, or source edit *on this
branch* can clear.

Attempts 1–30 landed zero mutations. Attempt 31 also lands zero, but adds one new,
independently derived fact that upgrades the diagnosis from "the files are absent" to
"the production seam the fix requires is absent" — see below.

## New fact this pass (not in report-5e96982e or any predecessor)

Prior passes established unreachability by **absence of files**. This pass establishes it
by **absence of the injection seam in code that is present**:

| Element | On this branch | Required by finding 1's own suggested fix |
|---|---|---|
| `tools/generate/src/cli/ai/toolbox.ts` | **present**, exports `l1Operations(slug, opts: GlobalOptions)` at `:239` | present |
| `GlobalOptions` (`tools/generate/src/cli/commands.ts:30`) | `{ cwd?: string; sandbox?: boolean }` — **no `store` field** | must accept `opts.store` |
| `ctxOf(opts)` (`commands.ts:35-38`) | builds `StoreContext` from `process.cwd()` — filesystem-rooted, unconditionally | store injected, no fs fallback |
| `makeMemorySite()` / `tests/support/site-factory.ts` | **absent** | present |
| memory store module | **absent** (see module list below) | present |

Finding 1 states — correctly, for `main` — that "both halves are testable with no
production change" because `l1Operations` "accepts `opts.store`". That premise is false
**here**. On `regression-cb0dad9c` the adapter cannot be driven against an injected store
because there is nothing to inject and no parameter to inject it through. Authoring
`test_UAT_AC1354_*` on this branch therefore requires adding the store seam to
`GlobalOptions` and `ctxOf` — i.e. porting REQ-142's production code onto a regression
branch. That is the one place feature work must not happen, so the finding is not merely
inconvenient here; it is structurally forbidden.

## Verification re-derived this pass (nothing inherited)

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| HEAD | `git log --oneline -3` | `6c3386f1d`, `408c92cb8`, `d22e2ba1d` — workflow/ticket/report commits only |
| Divergence | `git rev-list --count HEAD..main` | **501** commits on `main` absent here (was 500 last pass; `main` still moving) |
| Store modules | `git ls-files tools/generate/src/store` | 8 pre-port modules: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot`. None of `site-store.ts`, `memory-store.ts`, `fs-store.ts`, `assemble.ts`, `journal-model.ts`, `journal.ts` |
| Test support | `ls tests/support/` | `webui-installed.ts` only — no `site-factory.ts` |
| Runtime routing | `git ls-files \| grep -i vitest` | one file, `vitest.config.mts`; no `.node`/`.workers` split |
| AC-named UATs | `grep -ranE "test_UAT_AC13(2[1-9]\|5[34])_"` over `tools`/`tests` | zero hits |
| Port symbols | `grep -aln "fsSiteStore\|memorySiteStore\|makeMemorySite\|SiteStore" -r tools tests` | **one** hit: `tests/req111-public-site-serving.test.ts:12`, a comment naming the unrelated public-site-serving `SiteStore`. Confirms the name-collision hazard: a bare symbol grep looks like partial coverage but resolves to a different subsystem entirely |

All greps used `-a` (force text) per the survey hazard noted in report-5e96982e: two heavy
consumers of the editing surface carry NUL bytes as cache-key separators and are silently
skipped by a plain recursive grep.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| — | — | — | **None.** Every category available at level=uat (`uat-add`, `uat-edit`) targets files that do not exist in this tree, or requires a production seam this tree does not have |

### Why each finding was not actioned

| Finding | Category | Why not actioned here |
|---|---|---|
| 1 | `uat-add` (AC-1354) | Target is `main`. Requires `opts.store` on `GlobalOptions` + `makeMemorySite()`; neither exists here (`commands.ts:30`). Writing it would mean porting REQ-142 production code onto a regression branch |
| 2 | `uat-edit` (AC-1353) | Target file `tests/test_UAT_FC_REQ-142_site_store_port.test.ts` does not exist in this tree. The rename is a `main` edit |
| 3 | `needs_review` | Not repairable on this branch by construction. Forwarded below |
| 4 | `info` | No matrix action requested |
| 5 | `info` | Loop-design observation; explicitly "not a matrix edit" |

## Resolutions explicitly considered and rejected

These are the mutations that would have produced a non-zero `fixes_applied`. Each was
rejected on the merits, not skipped:

| Candidate | Why rejected |
|---|---|
| Deprecate AC-1353 / AC-1354 to clear the violation | The assessor categorized them `uat-add` / `uat-edit`, not `ac-deprecate`. No intent in the ledger retires them — REQ-142 is `free_and_reconciled` and live. Both ACs are legitimate **on `main`**, where the code lives. The ticket store is global, so deprecating them here would corrupt the matrix for every other branch to manufacture local green |
| Set `uat_coverage` on AC-1353 / AC-1354 | That field is owned by `check_uat_coverage` / `fix_uat_coverage`, not by this workflow. With no UAT in the tree the value would be false on its face |
| Author the UATs against `main` from this worktree | Out of scope for a regression fix loop, and its mutations commit to this branch. Cross-branch writes from inside a regression run are not a repair, they are a second defect |
| Add `store` to `GlobalOptions` so the AC-1354 UAT becomes writable | This is REQ-142's implementation. Adding it here is feature work on a regression branch — the precise action finding 3 forbids |

## Code Edits

None this call. No production change is defensible: the code that would be changed is not
absent by accident, it is on `main` by design, and the branch exists to regress the cut
point.

## needs_review Items Forwarded

| Element | What the assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854`, all 11 ACs (finding 3) | The capability under check is not present in the tree under check. Branch cut at `0f44ef1ba` (2026-08-19 17:43); REQ-141/REQ-142 implementation and UATs landed on `main` afterwards. Zero of 11 ACs verifiable here | **(a)** re-cut / refresh `regression-cb0dad9c` from current `main` so the uat level is evaluated against the code it describes, or **(b)** exclude `capability-c4c7a854` from this regression run |
| AC-1354 (`acceptance_criterion-56798f01`) (findings 1 + 5) | No UAT on `main` and none here; both halves of its Verification clause unasserted anywhere | Re-cutting the branch is **necessary but not sufficient**. AC-1354 has no UAT on `main` either, so a refreshed branch still fails this check until `test_UAT_AC1354_*` is authored on `main`. Both actions are required to clear this capability |
| AC-1353 + AC-1354 provenance (finding 5) | Both were authored **on this regression branch** by an earlier ac-level fix pass in this same run (`9c1fdab20` 08:43:36, `3ef83fd85` 08:59:43, both after the cut) | Loop-design question for the operator: the ac-level stage can add criteria to a branch-local matrix whose UATs are only writable against code the branch does not carry, which guarantees the following uat-level stage fails. Worth a guard on ac-add when the target capability's implementation post-dates the branch cut |

## Recommendation

**Stop the loop and escalate.** Per the project's failure/error taxonomy this is an
**error** (branch topology), not a recoverable **failure**: there is no defined fix-loop
path because the repair target is not in the tree. The repeated
`@fail` → `fix_uat_validation` → `@fail` cycle across 31 attempts is the symptom of an
error being handled as a failure. Declaring `progress_made=false` here is the honest
signal that ends it.

31 attempts have now produced zero mutations for the same reason each time. The next
useful action is an operator decision (re-cut or exclude), plus one `uat-add` on `main`
for AC-1354.
