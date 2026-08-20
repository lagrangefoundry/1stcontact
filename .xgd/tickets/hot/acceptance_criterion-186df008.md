---
uid: acceptance_criterion-186df008
id: AC-1351
type: acceptance_criterion
title: A column anchor is fitted per axis, with the capped extent, the keyframed inset
  fallback and the full-bleed refusal
created_by: xgd
created_at: '2026-08-20T12:53:22.219235+00:00'
updated_at: '2026-08-20T14:39:19.342923+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A node inside the recovered content column expresses its geometry **against that column**
— a column anchor — rather than against the page edge, so the reproduction re-centres at
unsampled widths instead of holding a captured absolute offset.

**An anchor is fitted per axis, not as one undivided thing.** A node's **left edge** and
its **extent** are fitted against the column separately, and either may anchor while the
other keeps its keyframes. Alignment is a property the page shares across siblings, while
a node's width is its own business. Coupling them — anchoring only where both axes fit —
leaves neighbouring runs on two different models and splits text the reference keeps
flush: one hero line whose width happened to equal the column extent anchors while its
three neighbours keep drifting keyframes, tens of pixels apart at an unsampled width,
which is worse than not anchoring at all. A node where neither axis fits carries no anchor.

**How an axis fits.** Each axis is expressed as an affine function of the column's extent
at that width — a constant plus a fraction of the extent — solved over the captured widths
and admitted only when it reproduces **every** sample to within a pixel. Two further
guards keep a fit from being a coincidence: the samples must show at least two distinct
column extents (a single extent cannot separate the constant from the fraction), and the
fitted fraction must be a **plausible share of the column** (a full run, a half, a third —
not a steep coefficient). A steep coefficient means the axis is tracking something else
that merely correlates with the column's growth over the sampled range — responsive type,
a shrink-to-fit glyph extent — and extrapolating it off-sample is how a run ends up
kilometres wide.

Three refusal rules complete it:

1. **A cap is admitted on the extent only, and only on an over-determined fit.** A nested
   maximum — a run that fills the column until its own narrower maximum takes over — is
   fitted from the samples that sit below that maximum, and only when **more samples than
   unknowns** support it. A two-unknown fit through two points is interpolation rather than
   evidence: the hero title's shrink-to-fit width fits any two of its samples and then
   "verifies" against the cap. A **left edge has no meaningful cap** — an element does not
   stop moving right at some width — so only the extent may be capped.
2. **Where a left edge has no closed form, only the residual inset is keyframed** — the
   column origin still carries the node, and the small remaining offset inside the column
   becomes a track that **inherits the node's own geometry segments**. This is typically a
   page that changes layout *mode* at a breakpoint (a 3-up grid stacking below `md`): the
   geometry track already classifies that jump as a snap, and the inset must agree with it,
   or the two halves of one position disagree about where the page's breakpoints are and a
   grid column slides off the right edge between samples.
3. **A full-bleed element spanning the viewport is never anchored at all.** The residual
   track is offered only to content that sits strictly inside the column: a full-bleed
   band's left edge is absolutely zero, and writing that as origin-plus-negative-origin and
   then interpolating the residual walks the band off the left edge at unsampled widths.

## Verification
Fold a multi-width capture of a page laid out in a centred column and assert that a run
whose left edge and width are both the column's function carries an anchor for both axes,
and that rendering at an **unsampled** width between two rungs places it where the
reference's column rule would — not at an interpolation of the captured absolute offsets.

Per-axis independence: fold a fixture whose hero lines share a left edge but have differing
widths — one of which happens to equal the column extent — and assert **all** of them
anchor their left edge (so they stay flush at an unsampled width) while only the fitting
one anchors its width. Assert the run whose width does not fit keeps its width keyframes
rather than losing its left-edge anchor with them.

Plausible share: fold a run whose width is a shrink-to-fit glyph extent under responsive
type, correlating with the column over the sampled range at a steep coefficient, and assert
no width anchor is emitted — rendering it at an unsampled width stays near its captured
size rather than running kilometres wide.

Nested cap: fold a run that fills the column below a breakpoint and holds a narrower
maximum above it, with at least three samples below that maximum, and assert a capped
width anchor whose maximum equals the reference's; reduce the samples below the cap to two
and assert the cap is refused (no width anchor) rather than fitted.

Keyframed residual inset: fold a 3-up grid that stacks below a breakpoint and assert its
columns anchor to the column origin with a keyframed residual inset whose segments equal
the node's own geometry segments — so the breakpoint snaps in both — and assert the third
column stays inside the viewport at an unsampled width just below the breakpoint.

Full-bleed refusal: assert a full-bleed band spanning the viewport at every width carries
**no** anchor, and that rendering it at an unsampled width keeps its left edge at zero
rather than walking negative.