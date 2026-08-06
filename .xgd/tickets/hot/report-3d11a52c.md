---
uid: report-3d11a52c
id: REPORT-1355
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-06T02:22:53.784082+00:00'
updated_at: '2026-08-06T02:22:53.784082+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-ee56a66e
  plan_item_index: '5'
---

Plan item 5 applied and verified.

**What I did:**

*Intent read* — REQ-103 in the bundle body: L1 could paint only flat colour or one *linear* gradient, and a background image was pinned to `cover`/`no-repeat` (BUG-13), so no surface could tile. The operator took proposal (b) — a typed `pattern` axis — plus the radial-gradient branch, and explicitly *rejected* proposal (c) (`backgroundRepeat`/`backgroundSizePx`) as re-opening BUG-13's default while still needing an asset per texture. Also recorded: linear-by-default is a decision (linear is what a capture folds to), and the residual — the warped perspective grids stay as assets, grain stays out of scope.

*Code read* — `l1PatternSchema`/`l1LinearGradientSchema`/`l1RadialGradientSchema` in `packages/site-schema/src/l1/schema.ts`; `patternLayers()`/`gradientCss()`/`surfaceDecls()` in `packages/framework/src/l1/render.ts`; `checkSurface()` pattern bounds in `packages/site-schema/src/l1/validate.ts`. Verified the interaction-state claim directly: `interactionStateShape` spreads `surfaceAxesShape` (so a state carries `pattern`) and `checkSurface` runs on hover/focus — so AC-832's shared-bound claim is code-true, not inferred. `tests/req103-l1-texture.test.ts` passes (6/6).

*Beyond the plan's `modify: []`* — I sharpened **AC-725**, which enumerated the shared surface group as a closed list that omitted `pattern`, described a gradient as linear-only, and stated a background layer order (scrim→gradient→image) that no longer matches the emitter. Leaving it would have made the matrix assert something the code contradicts.

Two things deliberately **not** absorbed as ACs: REQ-103's acceptance item 6 (xgd.dev's cream bands carrying the grid motif) is site definition data, not capability surface — recorded in Technical Context instead; and the warped-perspective residual is recorded as a stated limit of the axis, not a gap.

```
Upgrade mutations applied for plan item 5 of 12

Target Stories: story-d0a8cfad
Primary Story UID: story-d0a8cfad
Stories Modified: 1
ACs Modified: 1
ACs Added: 4
ACs Removed: 0

tickets_modified:
  stories:
    - "story-d0a8cfad"        # STORY-83 — surface group gains texture + radial branch; layer stack; envelope floor; REQ-103 technical context + residual
  acceptance_criteria:
    modified: ["acceptance_criterion-3320bbf9"]   # AC-725
    added:
      - "acceptance_criterion-053767be"           # AC-829 typed texture, no asset
      - "acceptance_criterion-daec5ea8"           # AC-830 linear|radial, branches don't mix
      - "acceptance_criterion-9c1ba2b3"           # AC-831 layer order + untextured byte-identical
      - "acceptance_criterion-2b193e62"           # AC-832 shared-check bounds incl. state deltas
    removed: []

Out of scope (unchanged): STORY-85, STORY-84, STORY-75, STORY-81, STORY-86, AC-726, storage/sites/**

Progress: 5 of 12 plan items complete
```

No runtime code was modified.
