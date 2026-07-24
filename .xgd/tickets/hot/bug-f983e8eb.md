---
uid: bug-f983e8eb
id: BUG-9
type: bug
title: promoteToFlow only promotes the root — structure recovery must recurse into
  nested regions (robustness fail under perturbation)
created_by: xgd
created_at: '2026-07-23T17:20:06.489167+00:00'
updated_at: '2026-07-23T17:39:00.302686+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: aaf91dae50b10b17a0a30417c40c070eeeb9a694
    reconcile_sha: null
    main_sha: null
  version: 0.0.181
  story_points: 2
---

Scope under [[request-7ff1bacd]] (REQ-88). Finding 3 from the gigabytealchemy
l1-gate re-run. A **stage-2 robustness bug** — distinct from the stage-1 fidelity
bug (missing 768 keyframe). Depends on [[bug-d18ad577]] (BUG-7) having fixed the
analytic flow *math*; this ticket fixes which containers we *create*. See
[[DOC-27]] (absolute base vs flow overlay).

## Behavior (bug)
On gigabytealchemy the envelope probes fail: `contentRobustness` finds overlaps at
**every** width and `offSample` finds them at 900px. The recovery pass promoted
only the root: `promoted == ['0']` — it wrapped the *entire page* into one flow
container **but only the pinned-text children**, leaving every non-promoted pinned
sibling (and the leftover flat pile's single median gap) behind. A single
top-level stack cannot keep a 3-card grid's interior spacing sane *and* the footer
sane simultaneously, so growth (2.5×) still overlaps. Reproduced against the real
capture: after recovery `contentRobustness` and `offSample` still failed.

## Root cause
`promoteToFlow` (tools/generate/src/l1/probes.ts) promoted at **one level** — the
failing pinned-text sibling group directly under the node it inspected — into one
flat container, rather than discovering the real nested regions (hero / grid /
footer, each its own flow container with its own interior). Too coarse: it kept
one median gap for the whole page and left non-text / non-flagged pinned siblings
absolute for the grown pile to overrun.

## Fix (implemented)
Recovery is now **region-aware**, walking the tree recursively:

- **Perturbed-overlap graph.** Evaluate the doc once per captured width at the
  perturbation scale; every overlap finding links the two colliding leaves. At
  each node, links between its *direct children* form connected components
  (`overlapComponents`, union-find) — the smallest pinned sibling groups that
  actually collide. Distinct regions stay distinct.
- **Each region → its own flow `stack`** with its own interior `medianGap` (a
  nested sub-stack), derived from the absolute measurements.
- **Nothing left pinned behind.** A node that needs recovery flows *all* its
  children — regions as sub-stacks, survivors as flowed items — so no pinned
  sibling remains for a grown region to overrun. Under CSS flow, stacked items
  never overlap and never clip, so both envelope probes hold.
- **Demand-driven.** A node with no colliding group is left fully absolute
  (per DOC-27's absolute-base / flow-overlay split); a roomy page promotes
  nothing.
- **`promoted` reporting.** A single region covering a whole node reports the
  node's path (backward-compatible `['0']`); multiple regions report their nested
  paths (`0.0`, `0.1`, …) — "nested regions, not just `['0']`".

Fidelity is measured on the untouched absolute base, so recovery never regrades
`sampleFidelity`. `groupKeyframes` / `failingSiblingGroups` (the old single-pile
helpers) are deleted.

Coordinate with [[request-7a6766b0]] (REQ-92): once real surface/box structure
folds in, recovery has genuine nested regions to promote instead of a flat pile —
the recursion already handles that case.

## Acceptance (met)
- Against the real gigabytealchemy capture: `offSample` + `contentRobustness` now
  pass after recovery; `promoted` lists nested regions
  (`["0.0","0.1","0.2","0.3","0.6"]`), not just `['0']`; `sampleFidelity` on the
  absolute base is unchanged (still clean).
- Perturbation fixture (grid + footer, flat root of tightly-packed regions)
  regresses the coarse promote: base fails robustness, recovery promotes 3 distinct
  regions, envelope holds, base fidelity untouched, single-region and roomy cases
  preserved.

## Tests
`tests/bug9-region-aware-promote.test.ts` — `test_UAT_FC_BUG-9_*`:
- `recovery_promotes_nested_regions_not_single_pile`
- `recovery_never_regrades_base_fidelity`
- `single_region_reports_node_path`
- `roomy_page_left_absolute`

Existing 3-probe / e2e / pipeline suites (reconciliation-3probe-gate, req86, req88)
remain green.