---
uid: bug-3aa2d0c9
id: BUG-8
type: bug
title: Fold drops the reflowed cell across a breakpoint — captured width loses its
  keyframe; snap holds the lower frame (fidelity fail at a sampled width)
created_by: xgd
created_at: '2026-07-23T17:19:54.193844+00:00'
updated_at: '2026-07-23T17:31:59.354582+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: b59b9c4f3d67661c09e1173389c6d13c15cbe67d
    reconcile_sha: null
    main_sha: null
  version: 0.0.180
  story_points: 1
---

Scope under [[request-7ff1bacd]] (REQ-88). Finding 2 from the gigabytealchemy
l1-gate re-run. A **stage-1 fidelity bug** (the absolute base is wrong at a
*captured* width) — distinct from the stage-2 robustness bug (recursive promote).
See [[DOC-27]] (idempotence / fixed points).

## Resolution (verified) — already fixed by REQ-92; this ticket adds the guard

**The defect was already fixed** by REQ-92 (commit `6ebc8ee8`, landed 8 minutes
before this ticket was filed). On current HEAD the gigabytealchemy `sampleFidelity`
probe passes at 768 (and all widths) with 0 residuals; every card carries a 768
keyframe at its exact captured box.

**The ticket's original root-cause hypothesis was disproven.** The alignment
seam (`buildResponsiveTable` inside `foldToL1`) does **not** drop the reflowed 768
cell — the three card headings key on distinct text, so they align across the
reflow and each keeps its exact 768 keyframe:
```
Positivity: [375:(48,2028,279) 768:(299,1831,171) 1024:(357,1517,229) …]
```
Capture and fold were always correct.

**The real cause** was in the analytic evaluator, not the fold. `evalGeometry`
matched a geometry segment *ending* at a breakpoint using a **closed** upper bound
(`width <= b.at`), so at the exact interior width 768 the `snap` segment ending
there (375→768, the card narrowing 279→171) returned the held lower (375) keyframe
— the stale pre-reflow box — and every element below inherited the cascade (the
1616px 768 FAIL). REQ-92 changed the interval to **half-open `[a.at, b.at)`**,
mirroring the renderer's highest-`min-width`-wins CSS: at an exact interior
breakpoint the segment *starting* there is active.

## Deliverable — the reflow-at-breakpoint regression guard

`tests/bug8-reflow-breakpoint.test.ts` (`test_UAT_FC_BUG-8_*`, 3 UATs). A synthetic
three-card grid that reflows stack→row at the 768 breakpoint (cards narrow 279→171,
so 375→768 classifies `snap`), asserting through the fold→gate seam:
1. every card keeps a keyframe at the reflow breakpoint (fold does not drop the cell);
2. the reflowed (upper) frame wins at the exact breakpoint — never the held lower frame;
3. `sampleFidelity` is clean at every width, including 768.

Verified the guard bites: reverting the half-open interval to closed turns 2 of the
3 UATs red (the keyframe-presence UAT correctly stays green — the fold is unaffected).

## Acceptance (met)
gigabytealchemy `sampleFidelity` passes at 768 and all widths; every element present
at a captured width has a keyframe there; idempotency (BUG-5 suite) holds (37/37 in
the fold/probe/gate regression scope). A reflow-at-breakpoint fixture regresses the
class. No production code change was required — the class is closed and now guarded.