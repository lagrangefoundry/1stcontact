---
uid: comment-aa865cd3
id: COMMENT-1098
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-16T09:21:25.819782+00:00'
updated_at: '2026-08-16T09:21:25.819782+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ef43f04b
  kind: note
---

Assessment complete. **REPORT-2099** (`report-ef43f04b`) — result **FAIL**, 8 violations / 8 warnings / 0 needs_review.

## Verdicts written

All 54 elements updated: 48 ACs, 5 stories, 1 capability.

- **ACs**: 41 pass, 6 fail (AC-631, AC-639, AC-643, AC-657, AC-720, AC-815), 1 deprecated (AC-637, already correctly marked)
- **Stories**: STORY-78 pass; STORY-75/77/79 fail; STORY-76 **stale**
- **Capability**: fail

Coverage is *structurally* complete — all 47 active ACs have a `test_UAT_AC<n>_*` test. Every failure is about depth of evidence.

## The core pattern

Five of the findings are one defect shape: **the test drives the seam beside the behavior, not the entry point that uses it.** In each case I confirmed the production line that could be deleted with the whole capability still green:

- `fidelity.ts:167` and `perceptual.ts:493` — the sole forwarding of `--size` into the render/shot; AC-639/643 both inject a pre-made actual side, so neither executes
- `index.ts:769/787/802/815` — `values-diff` now has *two* `--json` emit paths; AC-657's test never invokes the command, it re-implements `run()`'s path and parses what it just wrote
- `aligned-crops.ts:196` — AC-720 tests the pure options mapper, never the command that calls it

I verified two claims mechanically rather than inheriting them: `grep -c overflow` on the AC-815 fixture returns **0**, so the `Math.min(docW, …)` clamp at `extract.ts:499` has never been exercised; and the `itA` helper at `bug27-nested-backdrop-capture.test.ts:82` does `if (!capture) return`, which reports **pass with zero assertions** rather than skip.

## Two things you should decide on

**The fix loop is not reaching `tests/`.** This was attempt 7. `git log` over the five flagged test artifacts returns no commit after `164dc05ab` (2026-08-05) — not one has been edited across any cycle. Meanwhile two repairs *did* land in that window, both on ticket surfaces (AC-637's deprecation, earlier STORY-76 edits). The editor appears to act on `ac-edit`/`story-body-edit` and not on `uat-edit`/`uat-add`. Every unrepaired finding is in the latter two. Re-filing an eighth time likely won't change anything until someone confirms the editor can write to `tests/` at all.

**`.xgd/uat_index.json` is empty project-wide** — `{"acs": {}}`, stamped 2026-08-16. The prompt's prescribed AC→test lookup returns nothing for every AC in the project. I worked around it by walking `tests/` directly, but any fix workflow that trusts the index will mis-target. Filed as finding 16.

## Two limitations to flag

Test **execution was blocked** in this session (`npx` and `node_modules/.bin/vitest` both denied by don't-ask mode), so I could not re-confirm runtime behavior. All findings are source-derived and each names a deletable production line — which is arguably stronger evidence than a pass count — but I stated this plainly in the report rather than implying the suite was run. The previous cycle did execute these files and reached the same six failing ACs, which is a useful consistency check.

One judgment call worth surfacing: I kept **AC-658 as pass** where it could plausibly be failed. Its test drives the real `withCleanStdout` primitive, and the AC names that primitive as its mechanism; the wiring gap it shares with AC-657 is filed as warning 10 and folds into AC-657's fix. Failing both would double-count one defect.
