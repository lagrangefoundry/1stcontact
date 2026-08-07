---
uid: report-dfe14847
id: REPORT-1580
type: report
title: 'Overlap resolution: cluster 6'
created_by: xgd
created_at: '2026-08-07T16:07:51.657466+00:00'
updated_at: '2026-08-07T16:07:51.657466+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-17a279f7
  cluster_id: '6'
---

## Cluster 6 Resolution

**Boundary**: Gradient authoring: an L1 authorable value axis delivered inside a capture-and-diff story
**Stories resolved**: 2

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-82eb6908 (STORY-76) | confirm | capability-aa030c83 (CAP-63) | (no change) | Gradient is a capture/diff fidelity axis; CAP-63's declared scope explicitly claims it end-to-end, authoring included. |
| story-c490f1cf (STORY-80) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Owns the *scalar* value model (colour/length/radius form + palette overlay), which gradient stops consume but do not duplicate. |

### Why this overlap is acceptable

**The two stories are not duplicates and share no AC subject.** STORY-76's AC set
(AC-634, AC-635, AC-636, AC-637, AC-638) is about *gradients* — a composite,
directional, multi-stop value: its capture, its comparison tolerances, and the
resolver that authors it into a surface fill. STORY-80's AC set (AC-716, AC-928
through AC-932) is about *what form a single scalar value may take* — a hex literal
or a palette reference, dangling-reference validation, translucency as an axis of the
reference, resolution at the load boundary. The sets are disjoint in both subject and
verification.

**The relationship is consumption, not overlap.** AC-637 requires each gradient stop
colour to resolve "as either an absolute hex literal or a palette-role alias
(absolute-or-overlay)" — that is STORY-76 *consuming* the value model STORY-80 owns.
A dependency edge between capabilities is the normal shape, not a boundary violation.
STORY-76's own Technical Context records this explicitly: the stop colours "resolve
literal-or-role identically to the value system's colour dial, an instance of the
... mandate that the length/colour value system ... formalises."

**Capability scope statements agree with the current assignment.** CAP-63 names
"**Gradients as a first-class value** — text-fill ... and panel/surface gradients
captured with direction and ordered colour stops (including stop position offsets),
**authorable**, and diffed as a fidelity axis." The authoring half is deliberately
in-scope there, because the gradient value exists to close the fidelity loop the diff
axis opened — STORY-76's user story ends "...and I can author the panel gradient that
closes the gap." CAP-70 correspondingly lists "the `1c` capture/diff axes" as out of
scope.

**Boundary test is clean.** A change to stop-position tolerance, surface-gradient
capture, or the gradient resolver touches STORY-76 only. A change to palette entry
shape, dangling-reference failure, or load-boundary resolution touches STORY-80 only.
No AC would need editing in both stories.

### Rejected alternatives

- **Reassign STORY-76 → CAP-70.** Rejected: three of its five ACs (AC-634, AC-635,
  AC-636) are pure `values-diff` comparison behaviour. Moving the whole story would
  relocate part of the capture-and-compare spine out of the capture-and-diff
  capability — a strictly worse boundary than the one flagged.
- **Merge STORY-76 into STORY-80.** Rejected: merge is for stories describing the
  same behaviour. These describe different behaviour (gradient capture/diff/authoring
  vs. the scalar colour/length/radius value model), and the merge would drag the
  gradient diff axes into the framework-substrate capability.

### Verification

- Every story in the cluster belongs to exactly one capability; neither was skipped.
- No `capability_uid` changed, no story archived, no ACs reassigned — so all 11 AC
  relationships (5 on STORY-76, 6 on STORY-80) are preserved unchanged, and no test
  function required renaming under the `test_UAT_AC<number>_*` convention.
- All five STORY-76 ACs carry live UAT coverage
  (`tests/reconcile-gradient-first-class.test.ts` for AC-634/635/636/638,
  `tests/req62-gradient-panel.test.ts` for AC-637), so no AC in this cluster is a
  phantom that the overlap could be resolved by deletion.

### Note for a future structural rebalance (not actioned here)

The survey's phrasing — "an L1 authorable value axis" — points at a real but
*different* tension that overlap resolution cannot action. The live L1 gradient axis
(`l1GradientSchema`, the gradient panel fill, the `background-clip: text` text-fill
gradient, and the REQ-103 radial extension) sits in
`packages/site-schema/src/l1/schema.ts` and is owned by CAP-70's L1 substrate story.
STORY-76's authoring ACs (AC-637, AC-638) instead describe the *module-era* path —
`resolveSurfaceGradient` in `packages/framework/src/modules/text-style.ts` and the
gradient content field in `modules/validate.ts` — which CLAUDE.md flags as legacy
being dismantled under REQ-96.

That is a **supersession** question (does the module-era authoring delivery survive
REQ-96, and if not do AC-637/638 re-home onto the L1 substrate story?), not an
overlap between these two stories. Actioning it would require splitting AC-637/638
out of STORY-76 into a new or different story, which this step's constraints forbid
("Do NOT create new stories"; AC moves only as part of a merge). Recording it here so
the next rebalance or a REQ-96 reconciliation can pick it up deliberately rather than
rediscovering it.
