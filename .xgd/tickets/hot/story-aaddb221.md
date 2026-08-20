---
uid: story-aaddb221
id: STORY-116
type: story
title: 'Values-diff noise management: an exact capture reported as counted defects,
  in repair order, rolled up to ranked causes'
created_by: xgd
created_at: '2026-08-20T03:39:47.100579+00:00'
updated_at: '2026-08-20T06:01:14.310424+00:00'
completed_at: null
last_field_updated: body
status: unplanned
fields:
  intent_uid: request-07d0e3e1
  capability_uid: capability-aa030c83
  story_kind: feature
  story_points: 3
  updated_by:
  - request-3a11304d
---

## Story
**As a** person reproducing a captured site with the `1c` toolchain, **I want** the values-diff report to present a *noise-managed* view of an exact capture — every axis still compared exactly, but each known-invisible difference neutralised by a declared per-axis rule I can switch off, the multi-viewport ladder deduped to one row per defect rather than one row per cell, an axis that is merely the downstream shadow of another reported but not counted, each defect classified by how it is repaired and printed in that repair order, and the whole list rolled up into a handful of ranked causes each carrying a fix / review / accept disposition — **so that** the number the gate prints is a number I can act on: a delta that survives is by construction visible, a defect is counted once however many widths it fires at, and "do I care about this?" is a decision I make a few times per run instead of a hundred and twelve times.

## Description
The **false-positive half** of this capability's animating invariant. Its sibling closes false negatives by capturing more (`values-diff` capture blind spots); this one closes false positives, so that "0 value-diffs ⟺ pixel-faithful" holds in both directions. A gate that over-reports is not conservatively safe — the operator learns to ignore the number, and a genuine repair becomes invisible in it. (The founding measurement: fixing a real, user-visible responsive defect moved a 1323-delta multi-viewport count by −5, because the count was dominated by noise.)

1. **Noise is a layer over an exact capture, never a dropped axis.** Every axis stays captured and compared exactly; criticality is a **per-run overlay applied on top**, and it is a dial the operator can turn off to see everything (`--tolerant` widens the bands; the default is exact). Baking a tolerance or a normalisation into capture itself is forbidden — it would hide real signal on the *next* site, and a value that was never recorded cannot be recovered downstream. Each per-axis rule is one of three declared kinds — a tolerance (a sub-visual band), a normalisation (two encodings of the same painted result made equal), or a pairing/precondition fix (the axis is only read where it is genuinely painted) — and each must name the visible difference it claims does not exist.

2. **`--collapse` counts defects, not cells.** The multi-viewport ladder is the single biggest inflator of the raw count: one wrong value flagged at six widths reads as six deltas. The collapsed report dedups by (element text, property) into one row per **defect**, recording the set of widths it fires at, and folding its reference and our values into a single scalar when constant or an `a .. b` range when they vary across the ladder. The synthetic cross-element `systemic` rollups are excluded (they are their own view, not per-defect rows). The header states both numbers — unique defects, and the raw delta total they came from — so the compression is visible rather than silent.

3. **Derived axes are reported but not counted.** An element's absolute `position` is the cumulative integral of the `gap` and `size` deltas above it: a single upstream spacing cause drifts every element below it, so counting position double-counts that one cause as dozens of downstream shadows and buries the real list. Derived axes are printed in their own drill-down block with an explicit "not counted" note and excluded from the headline count and the repair classes. `size` and `renderedTextBox` are deliberately **not** derived — they measure dimensions, which is independent signal.

4. **Type-A / Type-B repair-order classification.** Every delta is either **Type A** — an author-set value, which the reference tells you literally and you *copy* — or **Type B** — emergent geometry, which is a *measure* of how far off you are and must not be set directly. Within Type A a defect is **structural** rather than **flat** when the reference value varies across the ladder, or when it fires at only some widths (a fluid reference against our fixed value). Section spacing is **not** a third trigger: REQ-73 retired the section band vertical-padding deltas (the sibling capture story owns that retirement), so no `§<n>` row can carry a `padding` property and the classifier does not key on one. The printed order follows from that and is fixed:

   1. **Type-A flat** → copy the literal into place; this kills the delta outright.
   2. **Type-A structural** → author the responsive ladder.
   3. **Type-B** → re-measure. What remains after A is right is the true residual, and it shrinks on its own as A is fixed.

   The order is load-bearing, not cosmetic: chasing a Type-B residual before its Type-A causes are corrected is measuring a moving target. This is the classification the sibling capture story's surface-bearing-box closure leans on when it says a phantom radius delta "led the printed repair order with a step that had no value to copy".

5. **`--clusters`: ranked causes with a disposition.** Even collapsed, a diff is a flat list of ~112 rows. The counted (non-derived) defects roll up into a small set of **causes** via a fixed delta-property → cause map, several properties sharing one cause where they evidence one decision (arrangement + containment = layout structure; shape + border = control styling — the shipped map also folds `outline` into that cause, see Technical Context). Each cause carries a count, its worst severity tier, representative elements, and a default **disposition** — `fix`, `review`, or `accept` — so a webfont-FOUT capture artifact is dispositioned `accept` while vertical spacing is dispositioned `fix`. Causes are ranked, and the report opens with a one-line "N causes: X fix / Y review / Z accept" summary. "Do I care about the Type-B residual?" becomes a per-cause call.

6. **A cluster must not manufacture a phantom cause.** Clustering is **viewport-aware**: each cause records the union of the widths its members fire at, and a cause that fires only at some widths says so. Without it, the collapsed view merged a mobile-only wrapping defect with a desktop glyph-width defect into one apparently-large "our columns are too wide" cause that did not exist at any single width. The rule is the same one the noise layer itself obeys — a roll-up may compress the report, never invent a defect the render does not show.

**In scope:** the noise-layer discipline (a per-run overlay over an exact capture, with an operator dial) and the per-axis rule kinds it admits; the `--collapse` per-defect dedup across the viewport ladder and its range folding; the derived-axis demotion and its drill-down block; the Type-A flat / Type-A structural / Type-B classification (reference-varies and fires-at-some-widths as its two structural triggers) and the repair order printed from it; the `--clusters` cause map, ranking, disposition and viewport-awareness; and the JSON shape of both views.

**Out of scope:** the capture axes and per-axis preconditions themselves — a marker recorded only where a marker paints, a node that paints nothing excluded from comparison, a run measured on its own text node — which are capture-side closures owned by the sibling capture-blind-spots story even where a noise audit is what surfaced them; the `gap` axis and the band-padding retirement (same story); the `--size` / viewport-ladder selection mechanism (size-aware diffing story); the `--json` stdout hygiene and flag-parsing mechanism (the CLI-correctness story — this story owns what the payload *means*, not that it lands alone on stdout); and writing any repair back into a site (an adopt/reproduction concern, not a diff concern).

## Technical Context
- Belongs to capability **1c Capture & Diff Fidelity** (`capability-aa030c83`). REQ-64 is the explicitly-named sibling of the REQ-63 coverage audit: *coverage closes false negatives; noise closes false positives — only with both does "0 value-diffs ⟺ pixel-faithful" hold.* The capture story states that pair; this story is the half it does not carry.
- **Why the noise layer must sit above capture rather than inside it.** A tolerance baked into extraction is unrecoverable — the raw value is gone, and the next site (different fonts, different engine) inherits a judgement made for this one. A tolerance applied at comparison time is a per-run policy: it can be widened, narrowed, or switched off without re-capturing, and the bundle stays a faithful record of what the page painted. This is the same "capture exactly, decide later" rule the capability applies to every axis.
- **Counting is a correctness property, not presentation.** A count that multiplies one defect by six viewports, or by every element downstream of one spacing cause, is not merely verbose — it makes the metric non-monotonic in fidelity, so a genuine improvement need not move it. Dedup-by-defect and the derived-axis demotion exist to restore that monotonicity, which is what makes the gate number usable as a gate.
- **A/B is a statement about how a value is obtained, and therefore about how it is repaired.** A Type-A value exists in the reference and can be transcribed; a Type-B value is produced by layout from the Type-A values around it. That is why the order is A-flat → A-structural → B and not a severity ordering: severity says how bad a delta looks, the repair class says whether there is anything to *do* about it directly. `gap` is the instructive case — Type-B (a sum) yet linearly invertible, so it is emergent but directly actionable.
- The cause map is deliberately a fixed table rather than an inferred grouping: an unmapped property falls through to itself with a `review` disposition, so a newly added axis surfaces as its own cause instead of being silently absorbed into a neighbour.
- **`outline`'s membership in the control-styling cause comes from the code, not from REQ-76.** The intent's taxonomy names two members (`shape` + `border`); the shipped `CAUSE_MAP` (`tools/generate/src/cli/fidelity.ts:463-465`) maps a third, `outline`, to the same `control styling` cause with the same `fix` disposition. That is consistent with the map's own rule — several properties share a cause where they evidence one decision, and `outline` is a captured axis of the sibling capture story that reads as the same authored control treatment — but it is a code-sourced extension of the intent's table, recorded here so the difference is deliberate rather than a drifted paraphrase.
- **The two structural triggers are the whole set, by cumulative intent.** REQ-64 (2026-07-17) never specified a section-spacing trigger; REQ-73 (`request-859652ae`, 2026-07-18, free_and_reconciled) is later and explicitly dropped the band-padding deltas that would have fed one, and the capture side records that retirement in `capture/values-diff.ts` where the `§<n>` rows are emitted (overlay / contentAnchor / textAlign only). The classifier's `§`+`padding` condition was therefore unreachable and has been deleted rather than left behind a flag (CLAUDE.md, "Simplicity Over Preservation").
- **Precedence between the two views is a dispatcher decision, so it lives in a pure helper.** `--clusters` wins over `--collapse` when both are given (causes ARE the roll-up of the collapsed rows), and `--json` chooses the serialisation, not the view. Both decisions are made by `selectMultiViewportPayload` (`tools/generate/src/cli/fidelity.ts`), which the command switch simply prints, so the precedence is provable without a real render.
- Both views are available as JSON as well as text, so the collapsed defects and the ranked causes are scriptable rather than screen-only.

## Dependencies
None.

## Story Points
3