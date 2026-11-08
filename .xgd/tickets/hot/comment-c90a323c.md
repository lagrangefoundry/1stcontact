---
uid: comment-c90a323c
id: COMMENT-8006
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-08T16:25:02.344591+00:00'
updated_at: '2026-11-08T16:25:02.344591+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d794ab0f
  kind: note
---

I've fixed both gaps from the failed reconciliation review (report-4c6f0257) and filed the completion report (REPORT-11513, `progress_made=true`, `needs_more_work=false`). I didn't run the tests, as the task said; the workflow runs the full suite next. No lint script or root tsconfig exists in the repo, so the new test code hasn't been type-checked either.

**G1: AC-2421 was only proven by reading source text.** I replaced that with tests that run the code:
- **New file, `tests/reconciliation-marked-points-served-modules.test.ts`.** Its first test runs the real `1c assets` build. It follows the imports from `/builder/main.js` and checks they reach the served anchor module, the measurement script and `points.js`. It then imports the built modules and checks they give exactly the same answers as the source modules.
- **A second test in that file uses a real browser** and skips with a printed reason when none can start. It runs the built `points.js` on a real edit preview without supplying its own measurement, so the default path is exercised. It checks that the `near:` lines match what `measure_drawing` and `nearestAnchors` give for the same drawing and point. It also checks that the mark's tooltip contains them.
- **Removed the old source-text check** from the AC-2421 test in `tests/reconciliation-marked-points.test.ts`.
- **AC-2421's wording is unchanged.** Only its Verification section was rewritten to describe the new evidence.

**G2: "coordinates on hover" had no AC and no recorded decision.**
- **STORY-174 has a new Reconciliation Decision.** The pill in the composer is plain text and can't show a hover, for the same reason as the atomic-pill split-out in BUG-72 §3. Reused letters stay unambiguous because deleting a point removes its pills (AC-2417) and points clear on send (AC-2424). The hover lives on the mark instead, as a tooltip showing the point's full description.
- **AC-2418 now includes the tooltip.** A mark inside a drawing shows that description once the drawing is worked out, and again after a drag. A mark on plain page content has no tooltip.
- **The AC-2418 test checks both cases:** no tooltip on plain content, and the correct description after dragging into the drawing.

**Things to watch:**
- **The browser test can't run in sandboxed sessions,** so I haven't seen it pass. Only the gate or you can run it.
- **It compares distances to 6 decimal places** between a measurement taken in the preview page and one taken in a blank page. They should match, but if it fails, that's the first place to look.
- **The tooltip can go stale (not fixed).** If a point is dragged from a drawing onto plain page content, its mark seems to keep the old tooltip, because nothing clears it. Production code is frozen in this phase, so I wrote the AC so it doesn't promise otherwise.
- **The orphan check is likely to fail next.** Many `test_UAT_FC_*` files remain in `tests/`, including the ones for REQ-210 and BUG-72. There's no orphan-check report for this bundle yet, so I left them alone.
- **The ticket store couldn't push to github.com.** The sandbox blocked the connection, so the ticket updates are only saved locally for now.