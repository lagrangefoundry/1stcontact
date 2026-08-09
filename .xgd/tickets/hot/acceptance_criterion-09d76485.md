---
uid: acceptance_criterion-09d76485
id: AC-709
type: acceptance_criterion
title: Demand-driven recovery promotes only the colliding regions to flow, recursively,
  and returns a valid L1 document
created_by: xgd
created_at: '2026-07-22T20:07:38.473705+00:00'
updated_at: '2026-08-09T08:19:58.290797+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Demand-driven structure recovery is **region-aware and recursive**. It walks the
document and, at each node, promotes only the smallest pinned sibling groups that
actually collide under content perturbation, leaving regions that already survive
perturbation absolute.

- **Regions are the colliding groups.** At each node, the direct children whose
  content collides under perturbation form connected components of the
  perturbed-overlap graph (a child pair is linked when any leaf beneath one overlaps
  any leaf beneath the other at any captured width). Each component of two or more
  pinned children becomes its own flow stack container, with its own interior gap
  derived from the absolute measurements of its members, ordered by their absolute
  vertical position. Distinct regions of a page (hero / grid / footer) therefore stay
  distinct rather than collapsing into one pile with one shared gap.
- **Nothing is left pinned behind.** A node that needs recovery flows **all** of its
  children — each colliding group as its own sub-stack, and every non-colliding
  sibling flowed alongside it — so no pinned sibling remains for a grown region to
  overrun.
- **Recovery is demanded, not applied by default.** A node with no colliding group
  keeps its children fully absolute; a document whose layout is roomy enough to
  survive perturbation is returned with nothing promoted.
- **Promoted paths are reported.** The result reports the promoted flow regions by
  path in the rewritten tree: a single region covering all of a node's children
  reports that node's own path, while multiple regions under a node report their
  nested paths.
- After recovery, the previously-failing regions keep the envelope under the same
  content perturbation (no overlap / clip) at every captured width.
- The returned document is a valid L1 document that satisfies the envelope validator;
  a recovery that would produce an invalid document is rejected rather than returned.
- Fidelity is measured on the untouched absolute base, never on the recovered overlay,
  so recovery cannot change the sample-fidelity verdict.

## Verification
On a folded fixture whose root pinned runs fail content-robustness, run recovery and
assert the root region is listed as promoted by the node's own path, the recovered
document passes content-robustness at every captured width, and the returned document
validates. Assert a region that already passes is not promoted and stays pinned.

Multi-region: on a fold whose page carries several independently-colliding bands
separated by roomy space, plus one lone non-colliding survivor run, assert recovery
reports more than one promoted region by nested path rather than a single whole-page
region; that each promoted path names a flow stack whose interior gap differs where the
bands' absolute spacing differed; and that no descendant of a recovering node — the
survivor included — remains pinned. Assert the recovered document validates and passes
both envelope probes at every captured width, and that the sample-fidelity report on
the untouched absolute base is byte-identical to its pre-recovery value.