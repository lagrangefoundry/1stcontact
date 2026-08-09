---
uid: report-5e5402aa
id: REPORT-1713
type: report
title: 'Overlap resolution: cluster 4'
created_by: xgd
created_at: '2026-08-09T01:21:04.027524+00:00'
updated_at: '2026-08-09T01:21:04.027524+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-69e94af9
  cluster_id: '4'
---

## Cluster 4 Resolution

**Boundary**: A gradient as captured/diffed fidelity axis vs authorable framework value
**Stories resolved**: 2
**Action taken**: confirm (both) — no story reassigned, merged or archived; CAP-63's scope amended to declare the value-axis ownership rule

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-82eb6908 (STORY-76) | confirm | capability-aa030c83 (CAP-63) | (no change) | Three of its five ACs (634/635/636) are pure capture-and-compare: stop-position tolerance and the surface-gradient diff axis. The two authoring ACs (637/638) do **not** target an L1 axis — they target the pre-pivot module content-field gradient and `resolveSurfaceGradient` in `packages/framework/src/modules/text-style.ts`, which the L1 renderer never calls. So the story reaches no CAP-70 artifact, and CAP-70 is a worse home than the one it has. |
| story-c490f1cf (STORY-80) | confirm | capability-ae9d65d6 (CAP-70) | (no change) | Owns the colour *form* — hex literal or palette reference — at every colour sink, including a gradient stop (AC-928 names gradient stops verbatim in that enumeration). It owns no gradient *structure*: no AC of its six mentions direction, stop ordering or stop offsets. |

### Why this overlap is acceptable

The survey named the missing rule precisely: *"does a new value axis follow the
driver that demanded it, or the layer that renders it?"* The answer is **the
layer that renders it** — and once stated, the matrix already conforms.

Where the survey's reading is wrong is its premise. It reads STORY-76's
authorable half as *"a typed value axis reaching the browser through the L1
renderer"*, which would indeed make it CAP-70's. As built, it is not:

- `resolveSurfaceGradient` is defined in `packages/framework/src/modules/text-style.ts`
  and is referenced only by `modules/index.ts`, the package root re-export, and two
  test files. **It appears nowhere under `packages/framework/src/l1/`** — the L1
  renderer never calls it. AC-638's counterpart validates a *module content payload*
  (`validateModuleContent`), not an L1 document.
- Its own AC-637 test records the supersession in comments: the palette-role half of
  "absolute-or-overlay" resolved to `var(--color-…)`, a custom property the retired
  colour token group emitted, and is now literal-only. The test file header states
  that the `text-block` panel which carried this render *"went away with the semantic
  layout modules (REQ-84)"* — so AC-637's text-block framing describes a deleted surface.

Meanwhile the live L1 gradient axis genuinely exists, and is **already filed in
CAP-70** — on STORY-83 (`L1 layout substrate rendered safe by construction`), not
on either story in this cluster. STORY-83 owns `l1LinearGradientSchema` /
`l1RadialGradientSchema` in `packages/site-schema/src/l1/schema.ts`, the
`surfaceGradient` and `gradientFill` axes emitted by
`packages/framework/src/l1/render.ts`, and — explicitly in its own body — the
deletion of *"the module-side resolvers that turned a role name into
`var(--color-<role>)` in a callout bar, a text run and a gradient stop"*.

So the layer rule is satisfied without moving anything:

| Concern | Rendered by | Owner |
|---|---|---|
| Captured gradient shape: direction, ordered stops, stop offsets | `1c capture` | CAP-63 / STORY-76 |
| Text-fill and surface-gradient comparison axes + tolerances | `values-diff` | CAP-63 / STORY-76 |
| Legacy module content-field gradient + `resolveSurfaceGradient` | `framework/src/modules` (superseded) | CAP-63 / STORY-76 |
| L1 gradient axis, linear + radial, validated and safely emitted | `framework/src/l1` | CAP-70 / **STORY-83** |
| What a colour at a gradient stop may *be* (literal or palette reference) | resolved at load, before paint | CAP-70 / STORY-80 |

The two stories actually paired in this cluster are the cleanest part of it.
STORY-76 owns what a gradient *is* (structure); STORY-80 owns what a colour *may
be* (form) wherever one appears, a gradient stop included. They intersect at
exactly one point — a stop's colour — and each owns a different axis of it.
Keyword mass confirms disjoint centres: STORY-76 is 37 `gradient` / 19 `stop` /
7 `direction` with **zero** occurrences of `reference`; STORY-80 is 14 `literal`
/ 10 `reference` / 10 `palette` with a single `gradient`, that being the
colour-sink enumeration. No AC is duplicated between them.

Rejecting the alternatives:

- **Reassign STORY-76 to CAP-70** would move stop-position tolerance and the
  surface-gradient diff axis — capture-and-compare behaviour, and the majority of
  the story — out of the capture-and-diff capability, to buy a better home for two
  ACs that point at a module seam CAP-70's post-pivot scope does not want either.
- **Merge** does not apply: the two stories describe different behaviours, share no
  AC, and neither is a duplicate of the other.
- **Split** is unavailable by constraint (no new stories) and would be wrong anyway:
  AC-637/638's subject is legacy module machinery, so splitting it out would create a
  story with no capability that wants it.

### Ticket change made

One amendment, to **capability-aa030c83 (CAP-63)** — additive, no content removed
(4629 → 6425 chars):

- The `Gradients as a first-class value` scope bullet claimed gradients were
  *"authorable"* without qualification, which is what let the survey read the L1
  axis into this capability. Retitled **"Gradients as a captured and diffed
  value"**, it now says which authoring surface is retained (the superseded module
  resolver, which the L1 renderer never calls) and disclaims the live L1 gradient
  axis explicitly.
- A new **"Ownership rule: a value axis follows the layer that renders it"**
  section states the rule the survey found missing, with the mechanical test: if
  the value reaches the browser through `packages/framework/src/l1`, it is CAP-70's.
  It also records why the opposite rule fails — reproduction motivates nearly every
  L1 axis, so "follow the driver" would pull them all here and dissolve this
  capability's own out-of-scope clause.
- History records this cluster's resolution.

Without the amendment the confirm would leave the matrix byte-identical to the
state the survey flagged, and the next survey would re-raise the same cluster —
the same reasoning cluster 3 applied to this capability.

### Observation for a later pass (not actioned here)

AC-637 and AC-638 are **stale, not misfiled**. Their subject — a module
content-field gradient, a `text-block` panel render, and a `var(--color-<role>)`
palette-role stop — was superseded by REQ-84 (semantic layout modules deleted),
REQ-96 (module aesthetic resolvers being dismantled) and REQ-114 (colour custom
properties retired; stops are literal-only). Both still pass, because the tests
were narrowed to the surviving resolver seam rather than the deleted render, and
AC-637's test carries the supersession in comments. Two of the three test
functions under those ACs still carry `test_UAT_FC_REQ-62_*` names, unreconciled.

This is a content-currency question for reconciliation, and out of scope for
overlap resolution, which may not modify story content outside a merge. Flagged
because if that authoring surface is ever re-homed onto the L1 gradient axis, the
ownership rule recorded above resolves it in one step: it would become CAP-70's,
alongside STORY-83.

### Verification

- Each story carries exactly one `capability_uid`, unchanged: story-82eb6908 →
  capability-aa030c83; story-c490f1cf → capability-ae9d65d6.
- No story reassigned, merged or archived, so no AC moved. AC counts re-queried
  after the amendment: 5 (STORY-76) and 6 (STORY-80), unchanged.
- No test renaming required — no AC changed story, so no `test_UAT_AC<N>_*`
  numbering is affected.
- No story body modified. The only ticket write was the CAP-63 body amendment,
  verified to retain the cluster-3 ownership rule and history entry.
- Both cluster stories were resolved; neither was skipped.
