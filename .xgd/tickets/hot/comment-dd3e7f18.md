---
uid: comment-dd3e7f18
id: COMMENT-1317
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T14:20:49.577928+00:00'
updated_at: '2026-08-20T14:20:49.577928+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-de34d8f0
  kind: note
---

Both findings from report-028c1de3 are closed. Report: **REPORT-2452 (report-de34d8f0)** — `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`.

**Violation 1 — AC-1352** (`tests/reconciliation-l1-fold-measured-axes.test.ts`):
- Added two card-shaped rows to `heroPage` — one travelling below the fold, one pinned in the hero's top half — and asserted **attribution rule 2**: the travelling card's `card-*` box carries `yFactor: 1` inherited from its representative row, the pinned one carries none.
- Added a `threeSectionPage` fixture whose two lower section edges travel at 1× and 2× the viewport delta, and asserted the **band-disagreement refusal**: uniform content folds `{yFactor: 1, heightFactor: 1}`; content that closes the band on the 1× edge at narrow rungs and the 2× edge at wide ones folds **no** response.

**Warning 2 — AC-1351**: added the off-sample `evaluateLayout(grid, 767)` check (tile on the column origin, right edge inside the viewport, no `clip` finding), the two-distinct-extents guard (a `maxWidthPx: 272` cap giving one extent refuses the anchor; the same page at 320 gives two and both axes resolve), and the plausible-share render half (the refused steep run stays inside its 200–500px sample envelope at 600/900/1150).

**Mutation-verified** — each new clause was checked by temporarily breaking the code it protects: deleting `fold.ts:1685-1688` (the card response) and weakening the `every(...)` band guard at `fold.ts:1572` both now go red, as do removing the `fitAnchor` distinct-extents guard and the residual-inset segment inheritance. `fold.ts` was restored each time; `git status` shows only the test file modified. All 42 AC-named UATs across the 9 suites pass (`Test Files 9 passed · Tests 42 passed`).

Two scope notes flagged for the assessor: at 767 the tile's *width* is 327px (the 375-rung value held by a `snap`), not `extentOf(767)`, so the assertion pins the left edge and the right-edge consequence rather than a width AC-1351 doesn't claim; and the one-extent fixture refuses **both** axes, not just width — `fitAnchor`'s guard sits above the per-axis split.
