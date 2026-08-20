---
uid: report-60c4f500
id: REPORT-2492
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 9'
created_by: xgd
created_at: '2026-08-20T18:16:05.177916+00:00'
updated_at: '2026-08-20T18:16:05.177916+00:00'
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

**Attempt**: 9
**Fixes applied this call**: 0
**Violations remaining**: 5 (plus 3 warnings, 1 needs_review)
**Needs more work**: true
**Progress made**: false — every actionable finding is blocked by finding 9, re-verified from source this pass

## Why zero mutations, again — and why that is the correct outcome

All eight actionable findings (1–8) are `uat-add` / `uat-edit` against
`tests/reconciliation-site-storage-port.test.ts` and `tests/…workers.test.ts`.
**Neither file exists in this worktree, and neither do the modules they must import.**

I did not carry attempt 8's conclusion forward on trust. Every claim below was
re-derived from source in this call:

| Check | Command | Result |
|---|---|---|
| HEAD | `git rev-parse HEAD` | `433ea8a6f` (advanced from `ab8de164b`; ticket commits only) |
| main | `git rev-parse main` | `bda6c9939` (unchanged) |
| merge-base | `git merge-base HEAD main` | `0f44ef1ba` (unchanged) |
| port test files @ HEAD | `git ls-tree -r --name-only HEAD tests \| grep -iE 'site-storage\|site_store'` | **empty** |
| store modules @ HEAD | `git ls-tree -r --name-only HEAD tools/generate/src/store` | `base, diff, fsutil, history, index, loadSite, paths, snapshot` |
| store modules @ main | `git ls-tree -r --name-only main tools/generate/src/store` | the same **plus** `assemble, fs-store, journal-model, journal, memory-store, site-store` |
| `edit.ts` @ HEAD | `git show HEAD:tools/generate/src/cli/edit.ts \| head -30` | imports `node:fs` (:1), `node:path` (:2), `../store` (:24) |
| port merge time | `git log -1 b18b859d7` | 2026-08-20 05:49:19 -0700 |
| branch cut time | `git log -1 0f44ef1ba` | 2026-08-19 17:43:02 -0700 → **12h06m earlier** |
| operator response | `xgd ticket comments capability-c4c7a854` | COMMENT-1347, COMMENT-1354 only — both assistant-authored |

**The six modules findings 1–8 would import — `site-store.ts`, `memory-store.ts`,
`fs-store.ts`, `assemble.ts`, `journal.ts`, `journal-model.ts` — exist on `main` and
are absent at HEAD.** Authoring the tests here fails at collection.

Worse than red-at-collection: AC-1353's first bullet requires `edit.ts` to be free of
`node:fs` / `node:path` / `../store`. At HEAD it imports **all three**, at lines 1, 2 and 24.
A faithful `test_UAT_AC1353_*` authored here would fail *correctly*, against code that is
correct for this branch — adding a knowingly-red suite to the branch whose sole purpose is
to gate a fast-forward of `xgd-stable`.

## Levers considered and rejected this call

| Lever | Why rejected |
|---|---|
| Author the UATs here | Red at collection (six missing modules); and AC-1353 would fail *correctly* against correct-for-this-branch code. Poisons the `xgd-stable` gate. |
| Author the UATs in the `main` worktree | Confirmed to exist (`git worktree list` → `…/main bda6c9939`), but writing there is a cross-branch free-coded change with no scope ticket, from a regression fix loop, that pre-empts the operator decision finding 9 exists to obtain. Out of this scope path. |
| Set `uat_coverage` on the 11 ACs | That field is owned by `check_uat_coverage` / `fix_uat_coverage`, not this loop. Writing it here manufactures movement without evidence. |
| `ac-edit` the ACs to match the frozen tests | Findings are categorized `uat-add` / `uat-edit`, not `ac-edit`. The ACs are right; the tests are absent. Narrowing intent to fit missing tests inverts the source of truth. |
| Post a tenth comment restating (a)/(b)/(c) | COMMENT-1354 already carries the decision verbatim from attempt 7. A repeat is a ticket mutation that would let me claim `progress_made=true` and buy an identical attempt 10. Declining deliberately. |

## Code Edits

None this call.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (repair of findings 1–8) | Findings are sound and the *check* is valid here — the ACs resolve from the global ticket store and the tests from `main` — but the *repair* has nowhere to land: the port merged to `main` 12h06m after this regression branch was cut. | One of (a)/(b)/(c) below. **(c) recommended.** |

**(c) — recommended.** Run `check_uat_validation` + `fix_uat_validation` for
`capability-c4c7a854` on a branch at or past `b18b859d7`. A worktree already exists at
`…/git_github.com_lagrangefoundry_1stcontact.git/main` (`bda6c9939`), so this needs no new
branch and no resync. Findings 1–8 become immediately actionable there, in the assessor's
stated order: 4 (deletion) → 3, 5 (extensions) → 1, 2 (new tests) → 6, 7, 8 (warnings).

**(b) — second choice.** Scope `capability-c4c7a854` out of regression `cb0dad9c`. Note this
only relocates the repair; the check is runnable here and its result is sound.

**(a) — least attractive.** Resync `regression-cb0dad9c` past `b18b859d7`. Makes findings
actionable here but changes what the regression is testing mid-run.

## Loop convergence — the part that needs attention beyond this capability

Nine consecutive passes have produced byte-identical findings. The check is deterministic
and its inputs have not moved: the only mutation in this worktree since attempt 8 is ticket
files. **A tenth pass against this tree will reproduce this report verbatim.**

The fix side has no lever it has not already tried and correctly rejected. I am returning
`progress_made=false, needs_more_work=true` so the loop exits to the assessor rather than
buying attempt 10 — this is the designed escape hatch for "blocked by needs_review", and it
is being used honestly here rather than defeated with a cosmetic mutation.

Per the assessor's own note, the inner loop's `progress_made=false` stuck signal has been
consumed by the outer `fix_uat_validation` → `check_uat_validation` cycle without escalating
to the operator across eight prior attempts. I have not investigated that mechanism — it is
outside this scope path — but it is flagged here because it is why this escalation has gone
unanswered since attempt 7, and no amount of correct behaviour on the fix side will surface
it without an operator looking.
