---
uid: comment-f1388b54
id: COMMENT-868
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-09T02:02:39.763178+00:00'
updated_at: '2026-08-09T02:02:39.763178+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a5db24c3
  kind: note
---

Report written: **REPORT-1721** (`report-a5db24c3`) — `result: fail`, `level: story`, violations 8, warnings 2, needs_review 0.

## Verdict: FAIL

The five stories describe the intent they *do* cover accurately. The failure is coverage — seven reconciled intents whose behaviour is live in production code inside CAP-63's own declared scope are expressed in no story anywhere in the matrix (I checked all 25), plus one new consistency violation.

**Violations (all re-verified at file:line this cycle, not inherited):**

| # | Intent | Gap | Evidence |
|---|---|---|---|
| 1 | REQ-73 | values-diff adjacent-`gap` axis | `values-diff.ts:364, 1406, 2276, 2533` |
| 2 | BUG-22 | split-control surface attribution | `values-diff.ts:2103-2125` |
| 3 | BUG-24 | band scrim capture across modern colour syntax | `extract.ts:1047-1071, 1425` |
| 4 | BUG-25 | per-text-node multi-run geometry | `extract.ts:676, 1106-1124` |
| 5 | BUG-16 | offline re-extract against mirrored faces | `reextract.ts:50, 100` |
| 6 | REQ-72 | in-browser hexify of `oklch`/`color-mix` stops | `extract.ts:334, 846, 1132` |
| 7 | REQ-76 | defect cause clustering / `--clusters` | `fidelity.ts`, `index.ts:260, 759-768` |
| 8 | REQ-84 + REQ-96 | STORY-76 still presents its gradient **authoring** half as live | `resolveSurfaceGradient` (`text-style.ts:223`) has zero production callers — only two test files import it; `text-block` (the host AC-637 names) is deleted from `packages/framework/src/modules/` |

Finding 8 is new since the prior cycle: the capability body recorded the REQ-84/REQ-96 supersession on 2026-08-08, but STORY-76's body was never brought into line.

**Warnings:** all five stories still name the pre-consolidation structure (CAP-64/65/66, "1c Values-Diff Fidelity"); and `fields.updated_by` on STORY-75/STORY-79 omits `bundle-31e474b9` and `bundle-4ff83a8b` even though the bodies reconcile their asks.

**Two things worth the operator's attention beyond the findings table:**

- **Nothing from REPORT-1643's coverage set (2026-08-07) has been repaired.** Its finding 1 (capability Scope bullet 4) *is* closed — the body was rewritten 2026-08-08. Findings 2–8 of that report are findings 1–7 here, unchanged.
- **One systemic root under four of the eight.** BUNDLE-10 (`bundle-4ff83a8b`, free_and_reconciled) appears as `intent_uid` or `updated_by` on **zero** stories in the entire matrix. BUG-22/24/25/16 are all its members; the ones BUNDLE-11 happened to re-carry (BUG-27) are covered, the rest are not. The same hole plausibly cost CAP-70 and CAP-71 coverage — worth re-walking BUNDLE-10's remaining members there. Separately, REQ-72/73/76 (all 2026-07-18) are named in no bundle body at all, so nothing downstream ever had an opportunity to story them.

No `code-issue` findings — every gap is the matrix failing to describe working code, not the reverse. Read-only throughout; no tickets, tests, or code modified.
