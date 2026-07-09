---
uid: request-65fa5199
id: REQ-47
type: request
title: 'Fidelity-diff: severity-ranked structural diff over a richer rendered projection
  (geometry/containment/arrangement), not pixel area'
created_by: xgd
created_at: '2026-07-06T22:10:21.251471+00:00'
updated_at: '2026-07-08T18:59:02.020061+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 8
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: df5732b5d72ad409328665bd01f57141e03e85a6
    reconcile_sha: null
    main_sha: null
  version: 0.0.48
---

## Scope

Make the fidelity-diff pipeline surface the differences that **actually matter to the eye** — structure, position, containment, arrangement, shape — instead of ranking by pixel area, which we proved is a bad proxy for importance. Surfaced by the gigabytealchemy import ([[REQ-20]]): three glaring, visually-obvious defects (hero paragraph block ~200px out of position; contact-form fields rendered as labels-above vs the reference's placeholders-inside; Subscribe button stacked-below vs the reference's inline-right) were **missed or actively deprioritised** by the current tools and by the operator-in-the-loop, because:

- the **values-diff** ([[REQ-31]]) only compares a thin slice of scalar properties (colour, font-size, line-height, padding) and is blind to geometry, structure, and arrangement;
- the **perceptual-diff** ([[REQ-38]]) ranks regions by `intensity × area`, so a small element that is 100% structurally wrong (the form) sorts *below* a large element that is mildly wrong in tone — and pixel count does not track eye-importance (a small image shift yields big pixel heat but is barely visible; rounded-vs-square corners are visually obvious but tiny in pixels).

This ticket is a **framework/tooling** change (successor to the fidelity tools [[REQ-31]] / [[REQ-38]]), not site config. It is the "close the loop" work that [[REQ-20]] repeatedly bounced off.

## Key principle — we diff the *rendered projection*, never the DOM

Their page and our reproduction have **completely different DOM trees** (their Tailwind/hand-HTML vs our Astro modules). Two pixel-identical pages can have arbitrarily different DOMs, so a DOM-tree diff is noise. The tools already avoid this: they compare a **normalised projection of the computed render** — text + `getComputedStyle`/`getBoundingClientRect` results — joined on **text** (verbatim between site and repro, so a near-perfect join key). Computed style + geometry is exactly the layer where two different DOMs that render identically become identical.

**Every captured field MUST be expressed in rendered / geometric / a11y terms, never in CSS-mechanism terms.** (E.g. capture "button box is right-of vs below the input box", NOT `flex-direction: row|column` — mechanism differs between frameworks; rendered result does not.)

## A — richer rendered projection (the capture is the contract)

Extend the capture/extract ([[REQ-12]] / [[REQ-31]] manifest) to record, per rendered element (not just per section — today only the 8 section boxes carry geometry; individual headings/paragraphs/inputs/buttons carry none):

1. **Geometry** — `box: {x, y, width, height}` from `getBoundingClientRect`, per element. (The harness already does this for sections; descend it to elements — same call.)
2. **Shape** — computed `border-radius`, `border-width/style`, `box-shadow` (rendered values, whatever CSS produced them).
3. **Structure / a11y** — element role and **accessible-name source** from the accessibility tree, e.g. `{role: "textbox", name: "Your email address", nameSource: "placeholder" | "label" | "aria"}`. The a11y tree is the browser's own framework-agnostic semantic projection — the right normalisation target for structural facts geometry can't see.

**Two hard cases to design explicitly:**
- **Text-free elements** (input box, image, divider, icon) have no text join key → pair on `role + order-within-section` or asset id. Fuzzier; this is the main false-positive source (acceptable — see B).
- **Placeholder-inside vs label-above** is not geometry or text-value; it is `nameSource` (a11y) + the relative geometry of the name vs the field box.

## B — categorise + prioritise the A↔A diff (severity, not area)

A pure function of A's output — no pixels, no heuristics:

1. Tag every delta with a **kind** (derivable from *which projected field* differs): `presence | containment | arrangement | position | size | shape | color | lineHeight | padding | …`.
2. Map kind → **severity tier** via a fixed constant table: **CRITICAL** = presence / containment / arrangement / position-past-threshold; **HIGH** = size; **MEDIUM** = shape / alignment; **LOW** = colour-within-tolerance / line-height / padding.
3. **Stable-sort by (tier, then magnitude).** Magnitude (Δpx, ΔE) is a tiebreak *within* a tier only — so a small-but-structural defect can never sort below a large-but-tonal one. Pixel area is never an input.

**Design stance — bias to over-emit (false positives are the cheap failure):** any field differing past a *loose* threshold emits a delta. Do **not** write logic to decide "this one's probably fine, suppress it" — that suppression logic is exactly where 6 months of corner-cases breed. A false positive costs the AI one glance; a false negative is the current disaster (ignoring the form). The tool is a **smoke detector, not a diagnosis** — it points the AI at the right place; the AI confirms. Thresholds are the only knob, set loose, never agonised over. The only fuzzy step anywhere is element *pairing*, which already exists (text join) and fails safe (unmatched → `presence` delta).

## C — structure-aware image diffs (optional; the residual layer only)

For the genuine visual residue A cannot project (photo/image content, gradient aesthetics, font-render quality, overall "does it feel right"):

- **Shift-compensated diff** — cross-correlate a block across vertical offsets, report "content identical, shifted +Npx" instead of diffuse "drift" heat (and thus distinguish pure translation from a real content difference).
- **Edge-diff** — Sobel both images, diff the *edges*: shape / outline / location / corners pop; uniform-fill tone shifts recede — matching what the eye weights.
- **Region → element labels** — hit-test each perceptual region's bbox against A's element boxes so a crop arrives labelled ("contact-form subscribe input + button"), not `@80,3856`.

**C is lower priority and partly redundant with A**: the wireframe/onion-skin overlay is just "draw A's boxes for both and overlay"; shift-compensation largely duplicates A's position delta. Build A first, B immediately after (nearly free given A), C last and selectively (edge + shift as a backstop for when pairing fails).

## Acceptance

- The three [[REQ-20]] misses each appear as an explicit, high-severity **text** delta from A→B, with no image inspection required:
  - `[position] "Intentional Software": Δy ≈ 195px` (CRITICAL)
  - `[containment] "Your email address": nameSource placeholder (ref) vs label (ours)` (CRITICAL)
  - `[arrangement] subscribe button: right-of input (ref) vs below input (ours)` (CRITICAL)
- Ranking is by severity tier, never pixel area; a small 100%-wrong element outranks a large mildly-wrong one.
- All A fields are rendered/geometric/a11y — no CSS-mechanism field (no `flex-direction`, no tag/class) reaches the diff.
- Over-emit verified: loose thresholds, unmatched elements surface as `presence` deltas rather than being dropped.
- `test_UAT_FC_<TICKET>_*` cover: element-geometry capture, the severity comparator ordering (structural-small > tonal-large), the placeholder-vs-label `nameSource` delta, and the arrangement-from-geometry derivation.

## Notes

- Runbook [[DOC-19]] should point here once landed ("how the fidelity tools rank differences, and why pixel area is not importance").
- The lesson driving this: the fidelity mean (e.g. "16.33 / 255") reads like "≈98% done" and manufactures false confidence while the most obvious defects sit unflagged. Status reporting should lead with the severity-ranked delta list, not the aggregate mean.

## Implementation decisions (A + B this cycle; C deferred)

Agreed scope for this pass: **A (richer rendered projection) + B (severity-tier ranking)**. C (structure-aware image diffs) is deferred — the ticket itself marks it lower-priority/partly-redundant, and A+B alone satisfy all three CRITICAL acceptance items (they are derivable from A's projection with no image work).

**Correction to the Scope section's mechanism note:** the perceptual-diff ([[REQ-38]]) does not rank by literal `intensity × area`. It scores each region by the **sum of block-averages** inside it (`score = Σ block-averages`, descending). That already partly balances large-faint ≈ small-intense; what it lacks is any *structural* signal (containment/arrangement/position) — which is the real gap B closes in the values-diff. The practical premise stands; only the stated formula was imprecise.

**A — capture extensions** (`tools/generate/src/cli/capture/{extract,sections,types}.ts`): add to each rendered element `box{x,y,w,h}` (per-element, descending the existing `absBox` from sections to elements), shape (`borderRadiusPx`, `boxShadow`), and a11y `{role, name, nameSource}` derived **in-page** in `EXTRACT_SCRIPT` (placeholder-attr / associated `<label>` / `aria-label` precedence). Text-free elements (inputs) captured as a new per-section `fields[]` list, paired by `role + document order` (fails safe: unmatched → `presence`). Per-element `arrangement` (`row`/`stack`) derived from geometry vs the previous element in the section.

**B — severity comparator** (`values-diff.ts`): every delta tagged with a `kind` → fixed `tier` table (CRITICAL: presence/containment/arrangement/position/text · HIGH: size/fontSize/fontFamily · MEDIUM: shape/borderLeft/gradient/fontWeight · LOW: color/overlay/contentAnchor/lineHeight/padding/letterSpacing). Sort = (tier, kindRank-within-tier, magnitude). `contentAnchor` stays LOW (the coarse proxy is superseded by the new per-element CRITICAL `position` kind — this preserves the existing REQ-31 `overlay > contentAnchor` ordering while making structural defects outrank tonal ones). Existing `property` names and the `overlay>contentAnchor` / `text>color` / `color>letterSpacing` orderings are preserved so REQ-31/REQ-35 UATs stay green.

**Containment:** kept from [[REQ-20]]/[[REQ-46]] in-flight work — this ticket touches only the `capture/` + `fidelity` tooling files, never the module `.astro` or site JSON those tickets are editing. UATs run on synthetic fixtures (no live browser, no gigabytealchemy repro), so REQ-47 lands without racing them.

Tests: `tests/req47-*.test.ts`, `test_UAT_FC_REQ-47_*` — element-geometry capture, severity comparator (structural-small > tonal-large), placeholder-vs-label `nameSource` containment delta, arrangement-from-geometry.