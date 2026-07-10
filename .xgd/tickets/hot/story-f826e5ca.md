---
uid: story-f826e5ca
id: STORY-62
type: story
title: Mechanical value-level fidelity diff (1c values-diff)
created_by: xgd
created_at: '2026-07-09T22:57:54.868394+00:00'
updated_at: '2026-07-10T01:59:46.095195+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  intent_uid: bundle-adc60ee8
  capability_uid: capability-4dd2cf78
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-df065afc
---

## Story
**As a** developer reproducing an existing website against a captured reference, **I want** a command that mechanically diffs the rendered *projection* of my draft against the captured reference — element by element, section by section, and across interaction states, viewports and engines — and ranks every disagreement by how much it matters to the eye, **so that** structural defects (an element out of position, a form label that renders above the box instead of inside it, a button stacked below instead of beside), near-neighbour colours, off-by-one type scale, wrong gradient direction, missing left-bars, casing slips, and scrim/anchor drift are flagged and *severity-ordered* automatically before human review — never buried under a large-but-tonal delta and never read as "≈% done" from an aggregate mean.

## Description
Screenshots and a thin scalar diff hide two whole classes of fidelity delta: (1) value-level drift — gold-vs-gold colours (`#f5e6a3` vs `#fbba72`), 72px-vs-48px type, a vertical-vs-horizontal gradient sweep, subtle left-bars, small-caps rendered as literal caps, a hero scrim; and (2) *structural* drift — an element 200px out of position, a placeholder-inside-vs-label-above form field, an inline-vs-stacked submit button, a wrong z-order, an ellipse-instead-of-circle photo, a mis-rotation, a missing hover/entrance motion, a font that fell back, a mobile reflow break. This story provides the mechanical safety net: a `1c values-diff` command that projects both the captured reference and our rendered draft to a flat value manifest keyed by verbatim text (text-free controls and media children paired by a11y-role + document order), aligns them, diffs each field, and emits a **severity-ranked** delta report — each row led by its severity tier — before any human looks. Vision is reserved for what a manifest cannot encode ("does the gradient read intentional"), not for reading a hex or spotting a structural break.

The command renders and serves the draft over loopback and reads its computed styles through the same headless-browser driver seam the eyes loop uses; a pre-extracted `--actual` manifest short-circuits the browser for offline / CI re-diffs. It compares per-run text/colour/font-size/weight/family/gradient/left-bar/line-height/letter-spacing/padding and the verbatim text (casing); per-section scrim overlay and content vertical-anchor; and — over the enriched projection — per-element geometry (position, size), shape (corner-radius/shadow), containment (accessible-name source), arrangement (beside/below), z-order, treatments (filter/text-shadow/mask), media (object-fit/aspect), transform (rotation/scale) and declared motion, plus own-render preconditions (viewport-width match, no horizontal overflow, web-font resolved). A `diffMultiState` pass pairs reference↔repro cell-for-cell on `{engine, viewport-width, interaction-state}` and surfaces any cell the repro never projected as a coverage gap.

Every delta is tagged with a **kind** (derived from which projected field differs) that maps through a fixed table to a **severity tier** — CRITICAL (presence/containment/arrangement/position/text/viewport), HIGH (size/font-size/font-family/z-order/media/overflow/font-load/transform), MEDIUM (shape/treatment/motion/border-left/gradient/font-weight), LOW (colour/overlay/content-anchor/line-height/padding/letter-spacing). Ranking is by `(tier, kind-within-tier, magnitude)` — pixel area is never an input, so a small 100%-wrong element outranks a large mildly-wrong one — while the prior REQ-31/REQ-35 pairwise orderings (`overlay > contentAnchor`, `text > colour`, `colour > letterSpacing`, missing highest) are preserved.

Diff-quality and trust controls keep a "clean" verdict meaningful: perceptual **OKLab ΔEOK** colour distance (default tol 0.02) replaces the raw-RGB approximation; a **systemic aggregation** rule escalates a LOW/MEDIUM kind that recurs across ≥N elements into one headline row (capped at HIGH) while keeping the per-element rows; **ignore-masks** suppress correct-by-design dynamic content (a default-on calendar-year fold so `© 2025` vs `© 2026` is inert, plus `--ignore <regex,…>` masks with an honest suppressed count, malformed patterns skipped not fatal); and an **anti-self-grading calibration oracle** seeds one known defect per fidelity axis and reports which fired, so a consumer can confirm the discriminator is calibrated — naming any blind axis — before trusting a clean verdict. Prior noise controls (per-metric jitter tolerances, font-weight bucketing, a strict exact-match mode, skipping inferred reference colours) are retained. The command exits non-zero when any delta remains after masking, so a fidelity gap fails CI.

## Technical Notes
- The projection is diffed, never the DOM: two pixel-identical pages with different DOM trees converge in computed-style + geometry + a11y space, so every captured field is expressed in rendered/geometric/a11y terms, never CSS mechanism (e.g. arrangement `beside/below`, not `flex-direction`).
- Structural/geometry comparisons are guarded on the field being present on *both* sides, so a pre-REQ-47/48 bundle (or a synthetic manifest) that carries none stays inert — the enrichment is additive and default-safe.
- The calibration oracle and `diffMultiState` are library-level entry points the fidelity harness/consumer composes; they are not new user subcommands. `--ignore` and `--compare-years` are the only new CLI flags surfaced on `1c values-diff`.
- Deferred (per the REQ-47/48 scope): structure-aware *image* diffs (shift-compensation, edge-diff, region→element labelling) are not implemented here; the enriched projection alone satisfies the structural-delta acceptance.