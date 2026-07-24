---
uid: bug-5186fa0c
id: BUG-18
type: bug
title: Flat text axes are single-valued at desktop — font-size not keyframed per width,
  text oversized at mobile
created_by: xgd
created_at: '2026-07-23T23:35:14.405652+00:00'
updated_at: '2026-07-24T00:37:33.350517+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 53fc6141b875b409b23d6a70344a87270407ca3e
    reconcile_sha: null
    main_sha: null
  version: 0.0.190
---

Scope under [[request-7ff1bacd]] (REQ-88). From the round-3 gigabytealchemy
values-diff. Realizes the "responsive behaviour applies to any property" point in
[[DOC-27]] — currently only geometry is responsive.

## Behavior (bug)
At mobile widths (320/375) text renders at **desktop size** (reference → actual):
- "Gigabyte Alchemy"  36 → 72
- section headings ("Our Mission", "The Alchemy", …)  30 → 36
- "Tools for clarity, presence…"  20 → 24

The target scales type down at narrow widths; we render one fixed (desktop) size at
all widths, so everything is oversized on mobile.

## Root cause
`foldToL1` takes a text run's axes from the **widest present cell** only
(fold.ts — axes from `framed[last]`), so `fontSizePx` (and other flat axes) are a
single desktop value applied at every width. Only `geometry` is keyframed per
width; flat axes are not.

## Fix direction
Keyframe responsive flat axes — at minimum `fontSizePx` — per captured width, the
same way geometry uses `interpolate|snap` between keyframes; the renderer emits a
fluid `calc()` / breakpoint value. Keep it to axes that actually vary across the
ladder (don't bloat static axes into tracks).

## Acceptance
Mobile (320/375) font sizes match the target within tolerance; no desktop-size text
at narrow widths; static axes stay single-valued. Tests named
`test_UAT_FC_<this-ticket>_*`. Keep body current.


## Resolution (free-coded 53fc6141)
Added a responsive scalar-axis track to L1 and wired it end-to-end:
- `l1ScalarTrack` schema + `text.responsive` (fontSizePx / lineHeightPx /
  letterSpacingPx), envelope-bounded per axis, keyframes at document widths.
- `foldToL1` emits a per-width track only for an axis that varies across the
  ladder (`responsiveTextTracks`); a static axis stays a scalar in `axes`.
- Renderer emits the track as media-queried CSS exactly like geometry (base =
  smallest-width keyframe, fluid `calc()` overrides), via the safe numeric sink.
- `evalScalarTrack` mirrors the renderer cascade; `expectedTextManifest` resolves
  each axis per viewport so the round-trip gate no longer expects desktop size at
  mobile.
Acceptance met: at 320/375 font-size folds/renders to the mobile value (36), not
the desktop value (72); static axes stay single-valued. UATs
`test_UAT_FC_BUG-18_*` cover fold, renderer, evaluator, and validator.