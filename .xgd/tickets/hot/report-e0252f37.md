---
uid: report-e0252f37
id: REPORT-2537
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 30'
created_by: xgd
created_at: '2026-08-20T21:18:02.968396+00:00'
updated_at: '2026-08-20T21:18:02.968396+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 0
  progress_made: false
  needs_more_work: true
  violations_remaining: 1
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 30
**Fixes applied this call**: 0
**Violations remaining**: 1 (AC-1354 coverage — fixable only on `main`)
**Needs more work**: true (but not by this loop — see below)

## Verdict

`needs_more_work=true, progress_made=false` → **the loop exits to the operator.** This is the
intended terminal transition, not a stall: per `CLAUDE.md`'s failure/error taxonomy, a
regression branch that predates the code it is asked to validate is an **error** (broken
precondition), not a recoverable **failure**. No edit to a ticket, a test, or a source file on
`regression-cb0dad9c` clears it.

## Re-derivation this pass (independent of report-73f81f03)

Every claim below was re-derived from git and the ticket store on this call. I did not trust
the prior report's summary.

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| HEAD | `git log --oneline -3` | `8b6804a26`, `dd4ba7b2b`, `00bba451a` — workflow/ticket/report commits only |
| Cut point | `git merge-base HEAD main` | `0f44ef1ba`, **2026-08-19 17:43:02 -0700** |
| `main` HEAD | `git log -1 --format='%h %ci' main` | **`5c064c9b3`, 2026-08-20 14:15:50 -0700** — advanced since report-73f81f03 saw `e983724df` |
| Store modules @ HEAD | `ls tools/generate/src/store/` | 8 pre-port modules only: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @ `main` | `git ls-tree origin/main --name-only .../store/` | those 8 **plus** `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Port UATs @ HEAD | `grep -rIoE 'test_UAT_AC1(32[1-9]\|35[34])' tests tools packages apps` | **no match** |
| Runtime routing @ HEAD | `grep -c workers vitest.config.mts` | **0**; single project, `include: ['tests/**/*.test.ts']` (line 61). No `.workers.test.ts` routing, no workers pool — AC-1328/AC-1329 have no configuration to assert over |
| Port surface @ HEAD | `grep -rIn --text -E 'fsSiteStore\|makeMemorySite\|opts\.store' tools/generate/src` | **no match** |
| ACs on STORY-118 | `xgd ticket list --type acceptance_criterion --filter fields.story_uid=story-3f4a5f2b` | 11, all `active` |

**Conclusion: 0 of 11 ACs are verifiable in this tree.** The capability under check is not
present in the branch under check; the cut point precedes the port by ~11.5 hours.

## Why no mutations were applied

Both actionable findings target files that do not exist on this branch:

- **Finding 1 (violation, `uat-add`, AC-1354)** requires `l1Operations` accepting `opts.store`,
  `fsSiteStore(...)` in `toolbox.ts`, and `makeMemorySite()`. Confirmed absent here by grep
  (forced text mode). Authoring the UAT here would require porting REQ-141/REQ-142's production
  code onto a regression branch — feature work in the one place it must not happen.
- **Finding 2 (warning, `uat-edit`, AC-1353)** targets
  `tests/test_UAT_FC_REQ-142_site_store_port.test.ts`, which does not exist here, and asserts
  over `site-store.ts` / `assemble.ts` / `journal-model.ts` / `memory-store.ts` — none of which
  exist here either.

Manufacturing progress by setting `uat_coverage` on these ACs was available and was deliberately
**not** taken: that field is owned by `check`/`fix_uat_coverage`, and setting it here would
record coverage that does not exist.

## New this pass (not in report-73f81f03)

1. **`main` advanced to `5c064c9b3` (2026-08-20 14:15:50) and findings 1 and 2 are still open
   there.** `git grep -lI --text -E 'test_UAT_AC135[34]' origin/main` → no match. So the two real
   matrix gaps have not been silently resolved by intervening `main` work; they remain the
   correct follow-up once the branch question is settled.

2. **Name-collision hazard — `SiteStore` exists on this branch, but it is not the port.**
   `apps/public-site/src/site-store.ts` defines an unrelated `SiteStore` interface with
   `R2SiteStore` (the published-site serving path, REQ-7), imported by
   `apps/public-site/src/index.ts`. A future pass grepping for `SiteStore` to test whether the
   port is present will get 8 hits on this branch and could wrongly conclude the port landed.
   **The editing-surface port is `tools/generate/src/store/site-store.ts`** — that path, and only
   that path, is the presence test.

3. Carried forward and honoured: the NUL-byte survey hazard. Every grep in this pass forced text
   mode (`grep -rI --text` / `git grep -I --text`); a survey that does not will under-report
   consumers of the editing surface.

## Actions Taken — by Resolution Category

None. No mutation on this branch would leave the matrix in a more valid state.

## Code Edits

None this call.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| **All 11 ACs / `capability-c4c7a854`** (finding 3) | The capability under check is not present in the tree under check: branch cut `0f44ef1ba` @ 2026-08-19 17:43:02 precedes port commit `2b902ead0` @ 2026-08-20 05:21:02. Confirmed independently this pass. | **Choose one:** (a) re-cut or rebase `regression-cb0dad9c` onto a `main` containing `2b902ead0` so the uat level is evaluated against the code it describes, or (b) exclude `capability-c4c7a854` from this regression run. |
| **AC-1354** (finding 1, violation) | No UAT anywhere in the repository; code supports the claim, only the assertion is missing. | Schedule `test_UAT_AC1354_*` as **`main` work** under the free-coding lifecycle. Not a `code-issue`. |
| **AC-1353** (finding 2, warning) | Substance proven on `main` under an intent-named test (`test_UAT_FC_REQ-142_*`); the `test_UAT_AC{number}_` convention resolves it to nothing. | Schedule the rename/wrapper as **`main` work**. Traceability only. |
| **REQ-141** (`request-b18d2056`, finding 4, info) | Status reads `ready_to_implement`, yet its deliverable is demonstrably merged on `main` and AC-1328/AC-1329 are active and covered. Read literally, the status would strand two covered ACs. | Was REQ-141 re-queued for a second iteration, or is the status field stale? |

## Recommendation

Stop the loop and settle the branch question. Attempts 1–29 applied zero mutations for this
reason; attempt 30 re-derived the blocker from scratch and reached the same wall by its own
route. A thirty-first attempt on this branch will reach it again.
