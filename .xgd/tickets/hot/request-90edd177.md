---
uid: request-90edd177
id: REQ-62
type: request
title: 'Gradient panel fill: capture + render + diff a background gradient (not just
  text fills)'
created_by: xgd
created_at: '2026-07-16T23:12:09.335239+00:00'
updated_at: '2026-07-19T04:53:19.311672+00:00'
completed_at: '2026-07-19T04:53:19.311672+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 3c5d60d5dec5bdc238e8bfd2857a2e9667bfbdb2
    reconcile_sha: null
    main_sha: null
  version: 0.0.122
  bundled_in: bundle-ab9e0cb6
---

## Goal

Reproduce a **gradient panel background** faithfully — capture it, render it, and
diff it. Currently a `background-image` gradient on a panel/card is invisible to
the whole pipeline.

## Why (three gaps, discovered under REQ-58 T-work)

The reference "What We're Exploring" panel is `bg-gradient-to-br from-slate-100
to-slate-200` (a linear-gradient background). Today:

1. **Capture blind spot** — `surfaceFillOf` reads `background-COLOR` only. A
   panel gradient is a `background-image` with a transparent background-color, so
   the extractor composites through to the band and records the band colour
   (#e8dfd3), NOT the gradient. `gradientCss` is captured only for
   `background-clip: text` (text fills), not panel backgrounds. So a gradient
   panel reads identically to no panel — the gate cannot see it (a false match,
   like the pre-fix alpha-compositing case).
2. **Framework gap** — no way to author a gradient panel fill. Card `surface` is
   a solid role or the translucent veil (REQ-58); there is no gradient fill.
3. **Diff gap** — no axis compares a panel/background gradient (only text-fill
   gradients are compared).

## Scope

1. **Capture**: extend `surfaceFillOf` (or a sibling) to record a panel's
   `background-image` gradient (raw CSS or normalized angle+stops), distinct from
   the composited solid `surfaceFill`.
2. **Framework**: a gradient panel treatment — a `surfaceGradient` (angle + stops,
   reuse the TextRunGradient shape + `resolveColor` per stop so stops are
   absolute-or-overlay) rendered as the card/panel `background`.
3. **Diff**: a `surfaceGradient`/panel-gradient axis (reuse the gradient
   normalization + comparison already used for text-fill gradients).

## Notes

- Sibling to the alpha-compositing capture fix (REQ-58 T5) and the border axis
  (REQ-58 T7) — a capture+framework+diff triple, not a one-line treatment.
- Closes the "What We're Exploring" surfaceFill + related deltas once all three
  land; a partial (render-only) fix would produce a false match (both sides read
  the band).
- Stops should be absolute-or-overlay colours (REQ-58 T11 `type: 'color'`).


## Implementation (2026-07-16) — landed, free-coded

A capture + framework + diff triple. `surfaceFill` (composited solid) and `surfaceGradient` (the gradient) are BOTH captured — a gradient panel now records its gradient *and* the band it composites through to.

**Capture** (`tools/generate/src/cli/capture/extract.ts`): new `surfaceGradientOf(el)` sibling to `surfaceFillOf`. Walks the same ancestor chain but returns the nearest painting ancestor's raw `background-image` gradient CSS, skipping a `background-clip: text` fill (the run's own glyph paint) and stopping at the first opaque solid. New `RawRun.surfaceGradientCss`.

**Diff** (`values-diff.ts`, `sections.ts`, `types.ts`): new `surfaceGradient` axis reusing `normalizeGradient` / `gradientsMatch` / `gradientLabel` (the text-fill gradient machinery) and mapped to the `gradient` kind/tier. Active whenever the reference defines it (fresh captures), so a *missing* panel gradient flags instead of the pre-fix false match.

**Framework**: new standalone `gradient` content-field type (`types.ts` + `validate.ts`, reusing `validateGradient`) — the gradient shape already validated inside `styled-text` runs, promoted to a field any module's surface can take. `resolveSurfaceGradient` extracted from `resolveGradient` in `text-style.ts` (shared `gradientImage` builder, no `background-clip: text` tail). text-block gains a `panelGradient` content field: when present it forces the `panel-gradient` class (padded/rounded/inset panel box) and paints the sweep inline; stops are absolute-or-overlay per `resolveColor`.

**UATs**: `tests/req62-gradient-panel.test.ts` (11, all green) + fixture `tests/fixtures/capture/gradient-panel.html` — framework render/validation, diff present-vs-missing, and real-Chromium capture proving BOTH surfaceGradient (135deg, #f1f5f9→#e2e8f0) and surfaceFill (#e8dfd3 band) are recorded, and a text-fill gradient is NOT mistaken for a surface.

Runbook [[DOC-19]] updated (values-diff axes + text-block gradient-panel capability).