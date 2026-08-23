---
uid: bug-3e3fabdb
id: BUG-22
type: bug
title: values-diff mis-attributes split text+box controls — phantom radius delta leads
  the repair order while the real geometry defect goes unreported
created_by: xgd
created_at: '2026-07-24T22:50:44.105883+00:00'
updated_at: '2026-08-05T17:38:10.947684+00:00'
completed_at: '2026-08-05T17:38:10.947684+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 9414e57932540e3e58396950a4a36f4299f32f40
    reconcile_sha: null
    main_sha: null
  version: 0.0.196
  story_points: 3
  bundled_in: bundle-4ff83a8b
  chat_comment: comment-3cf6bde1
---

Scope under [[request-7ff1bacd]] (REQ-88). Tooling defect in the reproduction
scoreboard. Found alongside [[bug-24975383]] (BUG-21), which it concealed.
Extends [[bug-9dafeb0b]] (BUG-15, values-diff reading L1 pages).

## Behavior (bug)
The target represents a control as a **single** node — `role: "action"`, carrying
text, `surfaceFill` and `borderRadiusPx` together. The L1 fold represents the
same control as **two** nodes: a `text` node for the label plus a sibling `box`
carrying the surface treatment.

`values-diff` matches by text, lands on the `text` node, reads `borderRadiusPx`
off it, finds none, and reports a delta:

```
[A] shape  radius 8px, shadow no  ->  radius 0px, shadow no
```

The radius is in fact correct at every stage of the pipeline:

- oracle: `role:"action"` ... `borderRadiusPx: 8`
- draft: `card-8`/`card-9` axes `{surfaceFill, borderRadiusPx: 8}`
- rendered CSS: `border-radius: 8px` present, twice

## Why this matters beyond a false positive
The phantom is classified **Type-A flat**, which puts it at the head of the
printed repair order:

```
repair order (REQ-64): A-flat 2 -> A-structural 1 -> B 14
  (1) copy the 2 Type-A flat value(s); (2) author the 1 Type-A structural; ...
```

Step 1 is a no-op — there is no value to copy. Worse, the *real* defect at those
same coordinates (BUG-21: surface boxes at 2x target height, the two highest
per-pixel error regions on the page) is not reported by `values-diff` at all. The
scoreboard directs the next repair pass at a no-op and stays silent on the
largest visual error.

This is the known values-diff blind-spot failure mode ([[doc-e8a65bcc]], DOC-19): a matched axis is not
proof, and here a *mismatched* axis actively misdirected. It will recur on every
site that has controls, not just this one.

## Root cause (confirmed)
Node-identity assumed 1:1 text-to-node correspondence. `surfaceFill` /
`surfaceGradient` / `borderLeft` already resolve over the **geometric surface
chain** (REQ-88 — tightest-first, so a sibling backing box counts), which is why
the fill matched. `borderRadiusPx` / `boxShadow` / `border` are read from the
element's **own** computed style, so on the split shape they were read off the
label — which paints nothing.

## What changed

**Capture records the surface-BEARING box, not just the surface colour.**
`ValueElement.surface` (`SurfaceShape`, on `ElementGeometry` so both the bundle
and live-extraction projections carry it) is resolved tightest-first over the
same chain `surfaceFill` uses:

```
surface: { self, box, borderRadiusPx, boxShadow, border } | null
```

`self` is the discriminator: **true** where the run's own element paints the
surface (a conventional page: `<button class="rounded bg-…">`), **false** where a
different box does (the flat L1 tree). Null when nothing paints behind the run.

**The diff resolves a split control against that box.** When the expected side is
`self` and the actual side is not, `shape` (radius + shadow) and `border` compare
against the backing box, and the backing box's **geometry** is compared against
the reference control's box — the axis the phantom was standing in front of.

Deliberately narrow, so it fires only where the two sides genuinely disagree
about node identity:
- a self-painting chip (BUG-20) is `self` on both sides → own-axis comparison
  unchanged;
- an ordinary run sits on its band on both sides → no surface-geometry rows, so
  no per-run band noise;
- a reproduction that really did lose the rounding still reports `shape`;
- a pre-BUG-22 bundle has no `surface` → the resolution is inert.

## Measured outcome (gigabytealchemy, real bundle)

```
before   17 defects   A-flat 2 -> A-structural 1 -> B 14
           [M] shape  "Send message"  radius 8px -> radius 0px   @all   <- no-op
           [M] shape  "Subscribe"     radius 8px -> radius 0px   @all   <- no-op
after    17 defects   A-flat 0 -> A-structural 1 -> B 16
           [H] size   "Send message"  surface 272x48 -> surface 320x96  @all
           [H] size   "Subscribe"     surface 272x48 -> surface 322x98  @all
```

Both phantoms gone, the repair order no longer leads with a no-op, and BUG-21's
2x-height defect is now on the scoreboard.

## Operational note — existing bundles are inert until re-captured
`surface` is a new capture field, so a retained bundle's `multistate.json` does
not have it and the resolution stays dormant (no behaviour change, no new
phantoms). Re-run `1c capture page <url>` to pick it up. The offline
re-extraction path (DOC-13 §9) was used to *verify* the numbers above against a
copy of the retained bundle, but its output cannot be promoted into a bundle:
it bakes the ephemeral `http://127.0.0.1:<port>/` loopback origin into
`backgroundImageUrl`. That is a pre-existing gap in offline re-extraction, not
part of this fix.

## Test plan
`tests/bug22-split-control-surface.test.ts` — the real `EXTRACT_SCRIPT` under
jsdom (BUG-15's harness), then the real `flattenSignals` -> `diffManifests`
pipeline. Both fixture shapes are measured from the retained gigabytealchemy
capture (reference button 123x50 @1280, `#009966`, radius 8; reproduction as the
draft actually folds it — backing box 173x100 at 388,3875 plus a 123-wide label).

- `test_UAT_FC_BUG-22_capture_records_which_box_paints_the_surface`
- `test_UAT_FC_BUG-22_no_phantom_shape_delta_when_the_backing_box_carries_the_radius`
- `test_UAT_FC_BUG-22_surface_geometry_defect_is_reported`
- `test_UAT_FC_BUG-22_a_genuinely_square_backing_box_still_reports_the_shape_defect`
- `test_UAT_FC_BUG-22_self_painting_controls_on_both_sides_are_unaffected`
- `test_UAT_FC_BUG-22_band_runs_gain_no_surface_geometry_noise`

Regression scope: full `vitest run tests/` — 726 passed, 1 pre-existing unrelated
failure (`req92-image-box-fold` "form controls stay residuals", fails identically
on a clean tree). Workspace-wide `tsc --noEmit` clean across all five packages.

## Acceptance criteria
1. Surface axes (`borderRadiusPx`, `surfaceFill`, `boxShadow`, `border`) on a
   split control resolve against the surface-bearing node; no phantom
   `radius N -> 0` delta for a control whose surface box carries the value. ✅
2. Geometry deltas on a split control's **surface box** are reported — BUG-21's
   2x-height defect must appear in `values-diff` output. ✅
3. The Type-A flat count for gigabytealchemy drops by the 2 phantom control
   entries, and the repair order no longer leads with a no-op. ✅ (2 -> 0)
4. Regression test covers the split-node shape (one oracle `action` node vs a
   reproduction `text` + sibling `box`). ✅