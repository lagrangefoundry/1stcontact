---
uid: comment-9df89b84
id: COMMENT-2550
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T15:27:26.680377+00:00'
updated_at: '2026-09-10T15:27:26.680377+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f5bcf66a
  kind: note
---

**PASS** — REPORT-3751 (`report-f5bcf66a`): 0 violations, 0 warnings, 0 needs_review.

## What I checked

Rebuilt the evidence independently rather than reading the prior cycle's tables:

- **AC set** — 41 ACs read from the ticket store on disk (24 under STORY-84, 17 under STORY-86; 34 `active`, 7 `pending`).
- **Symbol map** — restricted to `it('test_UAT_AC…` *declarations*, so the comment references at `…full-language.test.ts:95,218` aren't miscounted. Result: **41 ACs → 41 UATs, exactly one each**, no gap, no orphan, no duplicate number.
- **Execution** — all nine AC-traced files: **9 files, 41 tests, all passing** (1.36s).
- **Evidence validity** — no internal mocking anywhere. The only `vi.spyOn` uses are console capture and a `globalThis.fetch` spy at `…seams-and-refold.test.ts:540`, which is the external boundary and exists to prove AC-814's offline claim.
- **Staleness guard** — `git log e74beb8213..HEAD --name-only` names no `acceptance_criterion` file, so the bodies I graded are the ones the prior check graded.

## Findings

All 10 violations and 4 warnings from REPORT-3748 are closed — verified by reading each repaired UAT against its live AC body, not by trusting the fix reports.

Two worth calling out:

- **`tests/reconciliation-l1-fold.test.ts` is finally repaired.** It had been named in five consecutive reports with `git log -1` returning the same 2026-07-22 commit every time. AC-689 now folds a capture carrying media *and* a painted panel and asserts the leaf-kind set through the bundle path; AC-691 asserts `k.height === undefined` on the text leaf, pins height on a new image and panel leaf, and moved the constant-axis claim onto a genuinely constant run.
- **AC-1630 went from no evidence anywhere in the repo to the strongest UAT in the capability.** It closes on `toHaveLength(1)` and an exact detail string rather than a permissive `.some(…)` — which is what discriminates the pinned-box overflow from the horizontal viewport clip that fires in the same documents — and walks the epsilon boundary at 65/64/63px. `probes.ts:410` can no longer be deleted silently.

I filed four `info` entries, none requiring action. The one worth the editor's attention: AC-694's six-dimension contract is now proven browser-free, but against `CANNED_HINTS` returned verbatim by the fake driver — it proves the sidecar's *shape* round-trips, not that extraction computes those values. The accuracy half stays behind `chromiumAvailable()` and doesn't run here. That is exactly the repair the prior report prescribed (it explicitly said not to fix it by deleting the skip), so it's an environment bound, not drift — recorded so a later cycle doesn't re-raise it.
