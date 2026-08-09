---
uid: comment-f09297c4
id: COMMENT-872
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-09T02:57:55.045622+00:00'
updated_at: '2026-08-09T02:57:55.045622+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-132ab8fb
  kind: note
---

Assessment complete. **Result: FAIL** — report `REPORT-1724` (`report-132ab8fb`).

## Verdicts written

| Level | Verdicts |
|---|---|
| ACs (48) | 41 pass, 6 fail, 1 deprecated, 0 needs_review |
| Stories (5) | STORY-78 pass; STORY-75/77/79 fail; STORY-76 stale |
| Capability | fail |

Counts: **8 violations, 6 warnings, 0 needs_review**.

## What I did beyond reading

I ran all 11 test files carrying this capability's UATs under vitest rather than judging from source alone. That's what surfaced the most serious finding — and it only showed up because Chromium isn't available in this worktree.

## The findings that matter

**AC-815's only evidence is vacuously green.** `tests/bug27-nested-backdrop-capture.test.ts:82-86` defines a local `itA` helper that does `if (!capture) return` when Chromium is absent. Both AC-815 tests report `✓ passed 0ms` having asserted nothing. Two files away, `req58-wrapper-treatments.test.ts` uses `it.runIf(browserOk)` and correctly reports `↓ skipped` — the right pattern already exists in the repo. This is the difference between "known unverified" and "matrix claims verified when nothing ran."

**Four violations share one shape: the test drives the seam beside the behavior.**
- AC-639 / AC-643 always inject the actual side, so the `else` branches that carry `viewport` into the render (`fidelity.ts:166`) and the shot (`perceptual.ts:490`) never execute — deleting that argument leaves both tests green.
- AC-720 tests the pure `subRenderOptions` mapper but never `cmdAlignedCrops`, so it can't show the mapper is *used*.
- AC-657 re-implements `run()`'s `--json` path inside the test instead of invoking it.
- AC-631 hard-codes the composited colour it is meant to prove is computed; the real proof is Chromium-gated and skipped.

**AC-637 contradicts its own story body.** It claims a `text-block` renders a gradient panel; REQ-84 deleted that module (verified — `packages/framework/src/modules/` holds only `carousel/` and `contact-form/`), and STORY-76's *Out of scope* already says no module owns that render. The test was silently repurposed to the surviving `resolveSurfaceGradient` resolver. Marked deprecated, with an ac-add recommended for the surviving claim.

**STORY-76 is stale on REQ-114** — it still offers a "palette-role alias" gradient stop that REQ-114 retired to literal-only; both AC-637 and AC-638 tests carry explicit REQ-114 notes saying so.

Three stories still cite the pre-consolidation capability names (CAP-63 "1c Values-Diff Fidelity" / CAP-65 "1c Size-Aware Diffing") — batched as warnings, along with a missing `ac815` key in `.xgd/uat_index.json`.

One operational note: the ticket index lock was contended for ~25 minutes by a concurrent session running `--feature-branches` scans, so `xgd ticket list` timed out repeatedly. I enumerated the capability tree from the (fresh, non-stale) index files and read every ticket through `xgd ticket get`; all writes went through `xgd ticket update`.
