---
uid: story-16f2793c
id: STORY-77
type: story
title: 'Size-aware diffing: compare a captured site at a chosen viewport across the
  persisted ladder'
created_by: xgd
created_at: '2026-07-19T02:36:39.277949+00:00'
updated_at: '2026-09-10T01:55:41.162919+00:00'
completed_at: null
last_field_updated: uat_coverage
status: completed
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-aa030c83
  story_kind: feature
  story_points: 3
  uat_coverage: pass
  updated_by:
  - bundle-ab9e0cb6
---

## Story
**As a** person reproducing a captured site with the `1c` toolchain, **I want** the reference to be captured across the whole viewport ladder, and the fidelity-diff commands to compare my reproduction against it either at one chosen width (`--size mobile|tablet|desktop`) or across every rung at once (`values-diff --multi-viewport`), **so that** a layout that reflows only on a narrow screen (a `%`-vs-fixed width, a component that departs on mobile) is compared like-for-like at the width where it differs, instead of always being judged at desktop — and so that a single run can tell me the worst rung without my having to guess which width to ask about.

## Description
Extends the two existing single-width fidelity commands — `values-diff` (mechanical per-element value comparison) and `diff` (perceptual/pixel screenshot comparison) — with the persisted viewport ladder they compare against, a shared optional `--size` viewport selector, a ladder-wide `--multi-viewport` diff mode, plus the capture-side support the pixel path needs.

In scope:

1. **`values-diff --size <size>`** — the reference side is read from the reference bundle's persisted viewport ladder (the multi-viewport capture recorded at capture time) at the selected size's width, and the actual (reproduction) side is rendered at that same viewport, so the two are compared width-for-width. Without `--size` or `--multi-viewport`, the pre-existing single-width (≈ desktop) path is used unchanged.

2. **`diff --size <size>`** (pixel) — the actual side is shot at the selected viewport and paired against the reference bundle's *same-width* reference screenshot rather than the desktop full-page shot. Without `--size`, the pre-existing desktop screenshot path is used unchanged.

3. **Fail-loud on missing reference data** — a size-aware diff against a bundle that predates per-viewport capture must terminate with an actionable re-capture message rather than silently falling back to a desktop comparison the caller did not ask for. This applies to a values-diff against a bundle with no persisted ladder, a values-diff at a width the ladder never reached (the message names the widths it does carry), and a pixel diff against a bundle with no same-width reference screenshot.

4. **Per-viewport reference screenshots at capture time** — capturing a page persists one full-page reference screenshot per ladder width as a sibling artifact of the desktop shot, so a later size-aware pixel diff has a same-width reference to compare against. These are image siblings only; the persisted value matrix carries no image bytes.

5. **The ladder itself is a capture-time artifact of this story, not borrowed infrastructure** — `1c capture` persists the reference's per-element value manifest at every rung of the viewport ladder, not only at desktop. Everything else here reads that ladder: the `--size` selector picks one rung from it, the pixel path pairs against its same-width screenshot, and the ladder-wide mode below walks all of them.

6. **`values-diff --multi-viewport`** — the ladder-wide mode. Rather than asking the caller which width to judge, it projects the served draft across *every* rung the reference bundle persisted, diffs cell-for-cell (one cell per element × width), and reports **worst-cell-first**, so the rung where the reproduction is furthest off leads the report whether or not the caller suspected it. Like the `--size` path it fails loud rather than degrading: a bundle with no persisted ladder terminates with the re-capture message instead of quietly collapsing to a desktop-only comparison. This is the mode the reproduction work was actually driven with, and the mode whose cell counts the noise-audit tolerances were calibrated against.

7. **`--collapse`: report per defect, not per cell** — a single real defect that reproduces at all six rungs is one defect seen six times, not six defects. `--collapse` deduplicates the cell rows down to one row per distinct defect, so the ×N-viewport multiplier stops inflating the count and the report's headline number is a count of things to fix. The un-collapsed cell view remains the default, because which rungs a defect appears at is itself diagnostic (a defect present only at the narrow rungs is a breakpoint problem, not a value problem).

8. **`--clusters`: rank the collapsed defects by cause, each with a disposition** — the layer above `--collapse`, and the one that makes a long report actionable. Collapsed defects are rolled up by the **cause** each evidences rather than by the property it fired on, because several properties are one cause: arrangement and containment are both *layout structure*; shape, border and outline are all *control styling*. Each cause carries its count, the worst tier any member reached, the set of widths it fires at, and a few representative elements, ranked count-first then worst-tier.

    Each cause also carries a **disposition** — `fix` (a real, closeable gap), `review` (judge per case, typically structural), or `accept` (a capture artifact or sub-visual residual to sign off) — and the report summarises as "N counted defects roll up to M causes: X fix / Y review / Z accept". This is what turns a hundred-row diff into a handful of decisions: the operator makes one call per cause instead of per row. Two rules keep the roll-up honest: **derived axes are never counted** (a position delta is a consequence of some other defect, not a defect of its own, so counting it double-counts its cause), and **width scope is always shown**, so a cause that fires only at the narrow rungs is not read as an all-width one — the exact misreading the ladder-merged view would otherwise invite.

    The cause taxonomy names STORY-75's value axes; the dispositions are the standing per-cause verdicts the noise audit reached (a reference webfont FOUT defaults to `accept` for the reason STORY-75 item 7 gives). A property with no taxonomy entry falls back to its own name at `review` rather than being dropped, so a newly added axis appears in the ranking the day it lands instead of silently vanishing from the count.

Out of scope: the standalone cross-size `responsive-diff` analysis command (separate story, builds on this one) — that command analyses ONE captured site across sizes and is not a reproduction-vs-reference comparison, where the `--multi-viewport` mode here is exactly a reproduction-vs-reference comparison repeated per rung; per-breakpoint reproduction dials; inferring CSS units or between-size transitions (REQ-61 fixes the objective at "looks the same at each discrete size"); the identity, tolerance and severity of the individual value axes being compared in each cell, and whether any given delta is real (STORY-75 owns those — this story owns which reference cell each comparison runs against, and how the resulting deltas are ordered, counted and grouped for reading).

## Technical Context
- Shares the `mobile|tablet|desktop` viewport vocabulary already used by the shot/viewport preset system; the same vocabulary is reused by the downstream `responsive-diff` command.
- The values-diff reference at a size comes from the persisted multi-viewport ladder; a single deterministic reference cell is chosen per width (prefer the primary engine at rest). The ladder persistence and the `--multi-viewport` diff mode landed under REQ-58 (T2/A) and are owned by this story; the `--collapse` per-defect reporting layer over that mode landed under REQ-64, and the `--clusters` cause view over *that* landed under REQ-76.
- **The three reporting views are one stack, which is why they are one story.** Cells (`--multi-viewport`) → defects (`--collapse`) → causes (`--clusters`): each consumes the previous one's output, and each exists to remove a different way the raw cell count misleads. Cells inflate by the viewport multiplier; defects inflate by the property multiplier (one cause firing on three properties); causes are what an operator can actually decide about. Splitting them across stories would separate a function from the collapse it calls on its first line.
- Generalizes the single-fixed-width comparison this capability (CAP-63, 1c Capture & Diff Fidelity) started from, in two directions: to a caller-chosen width via `--size`, and to the whole ladder at once via `--multi-viewport`. The per-element axes being compared in each cell are STORY-75's; this story owns *which* reference cell each comparison runs against and how the resulting cells are ordered and counted.
- Divergence note for regression: both `--size` and `--multi-viewport` are optional and default to the legacy single-width path, so existing single-width diff behavior is preserved byte-for-byte when neither flag is present. `--multi-viewport` is a boolean toggle; that it parses as one rather than swallowing the following slug is STORY-79's argv guarantee, not restated here.

## Dependencies
None. (Downstream: the `responsive-diff` command — plan item 4 — builds on the ladder + same-width-selection machinery introduced here.)

## Story Points
3