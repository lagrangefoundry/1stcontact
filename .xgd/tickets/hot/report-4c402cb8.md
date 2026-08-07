---
uid: report-4c402cb8
id: REPORT-1657
type: report
title: 'Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
  (level=story)'
created_by: xgd
created_at: '2026-08-07T23:27:53.620126+00:00'
updated_at: '2026-08-07T23:27:53.620126+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2049c9ec
  level: story
  violations: 7
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: L1 Reproduction Pipeline: Fold & Acceptance Gate
# Level: story

**Result**: FAIL
**Violations**: 7
**Warnings**: 1
**Needs review**: 0

Capability `capability-2049c9ec` (CAP-71) holds two stories: STORY-84 (the fold)
and STORY-86 (the 3-probe gate + cross-gate reconciliation). Both carry
`intent_uid: bundle-31e474b9` (BUNDLE-7) and `updated_by: bundle-ee56a66e`
(BUNDLE-11).

The gate half (STORY-86) is in good alignment. The fold half (STORY-84) has
**drifted behind the BUNDLE-10 fold wave**: six distinct fold behaviours that
`tools/generate/src/l1/fold.ts` demonstrably implements today are absent from —
and in two cases directly contradicted by — the story body and its ACs. In
addition, REQ-88's headline deliverable `1c repro` is expressed in **no story in
the entire matrix**.

## Cumulative Intent Considered

Chronological ledger of the reconciled intents that touched this capability.
(ACs under both stories carry no `intent_uid`/`updated_by` of their own, so
attribution is resolved at story level via the bundles, plus the intent bodies'
own scope statements.)

| Intent ID | Status | Bundle / when | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 | free_and_reconciled | BUNDLE-7, 2026-07-22 | Framework pivot to L1 substrate + capability modules | YES |
| REQ-83 | free_and_reconciled | BUNDLE-7, 2026-07-22 | Capture→L1 fold (keyframes + oracle) + structural-hint extractor — origin of STORY-84 | YES |
| REQ-86 | free_and_reconciled | BUNDLE-7, 2026-07-22 | End-to-end 3-probe gate — origin of STORY-86 | YES |
| REQ-66 | free_and_reconciled | earlier | `adopt-values` — later superseded by the L1 fold (AC-696) | YES (retired) |
| BUG-5 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Fidelity pairing by stable occurrence identity + idempotency | YES |
| BUG-6 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Fold must signal residuals, not drop | YES |
| BUG-7 | free_and_reconciled | BUNDLE-8, 2026-07-29 | `evaluateLayout` row/flow tiling | YES |
| BUG-8 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Half-open breakpoint intervals (diagnosed as evaluator, not fold) | YES |
| BUG-9 | free_and_reconciled | BUNDLE-8, 2026-07-29 | `promoteToFlow` must recurse into nested regions | YES |
| REQ-90 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Document-level font/asset resource table (fold populates it) | YES |
| REQ-91 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Pixel-mover axes (CAP-70 owns axes; fold carries them) | YES |
| REQ-92 | free_and_reconciled | BUNDLE-8, 2026-07-29 | Rebuild `foldToL1` to the full L1 language, signalling residuals | YES |
| REQ-88 | free_and_reconciled | BUNDLE-10, 2026-08-05 | `1c repro` + `1c l1-gate`: bundle → servable, gate-able site | YES |
| REQ-93 | free_and_reconciled | BUNDLE-10, 2026-08-05 | L1 pages host behavior modules in their slots (`forms.json` seam) | YES |
| BUG-11 | free_and_reconciled | BUNDLE-10, 2026-08-05 | Fold must carry surfaceFill/surfaceGradient | YES |
| BUG-12 | free_and_reconciled | BUNDLE-10, 2026-08-05 | Captured font faces must reach the fold's resource table | YES |
| BUG-13 | free_and_reconciled | BUNDLE-10, 2026-08-05 | Section/CSS background-images as foldable nodes | YES |
| BUG-14 | free_and_reconciled | BUNDLE-10, 2026-08-05 | Rebuild the section-band → card → text **hierarchy**; stop per-run boxing | YES |
| BUG-17 | free_and_reconciled | BUNDLE-10, 2026-08-05 | Fold must carry captured element padding onto leaves | YES |
| BUG-18 | free_and_reconciled | BUNDLE-10, 2026-08-05 | Keyframe responsive **flat** axes (font-size etc.) per width, not widest-only | YES |
| BUG-19 | free_and_reconciled | BUNDLE-10, 2026-08-05 | Full-bleed **bar** fill detection seeds a band (footer/nav strip) | YES |
| BUG-20 | free_and_reconciled | BUNDLE-10, 2026-08-05 | A self-painting chip run carries its own surface on its **text** leaf | YES |
| BUG-21 | free_and_reconciled | BUNDLE-10, 2026-08-05 | Control surface boxes must not double-apply padding | YES |
| BUG-23 | free_and_reconciled | BUNDLE-10, 2026-08-05 | Bind every asset handle to the bundle's mirror; unmirrored = hard fail | YES |
| BUG-25 | free_and_reconciled | BUNDLE-10, 2026-08-05 | Multi-line text runs must not share one box (capture-side, CAP-63) | YES (CAP-63) |
| BUG-27 | free_and_reconciled | BUNDLE-11, 2026-08-06 | CSS bg-images/lazy media uncaptured — motivated the cross-gate verdict | YES |
| REQ-94 | free_and_reconciled | BUNDLE-11, 2026-08-06 | Cross-gate reconciliation, perceptual floor, coverage, named causes | YES |
| REQ-96 | free_and_reconciled | BUNDLE-11, 2026-08-06 | L1 `control` node — fold binds captured controls to module seams | YES |
| REQ-63, REQ-15/16/22/24 family | free_and_reconciled | various | Capture/values-diff axes — CAP-63, not this capability | out of scope |
| REQ-82, REQ-84, REQ-85, REQ-97–REQ-107 | free_and_reconciled | BUNDLE-7/11 | L1 schema, renderer, validator, axis vocabulary — CAP-70 | out of scope |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-86 (gate) | REQ-79, REQ-86, BUG-5, BUG-7, BUG-8, BUG-9, REQ-94, BUG-27 | aligned — every reconciled gate intent is expressed (AC-705/724 ← BUG-5; AC-734 ← BUG-7; AC-735 ← BUG-8; AC-709 ← BUG-9; AC-852–856 ← REQ-94/BUG-27). One stale cross-reference (finding 8). |
| STORY-84 (fold) | REQ-79, REQ-83, REQ-92, REQ-90, REQ-96, BUG-6, BUG-11, BUG-12, BUG-13 | partially aligned — AC-733 ← BUG-6; AC-731 ← BUG-11; AC-732 ← BUG-12/REQ-90; AC-812 ← BUG-13; AC-813 ← REQ-96; AC-696 ← REQ-66 retirement (verified: no `adopt-values` remains in `tools/generate/src/`). |
| STORY-84 (fold) | BUG-17, BUG-18, BUG-19, BUG-20, BUG-14, BUG-23 | **drifted** — six BUNDLE-10 fold behaviours shipped in `fold.ts`/`assets.ts` and are unexpressed or contradicted (findings 1–6). |
| CAP-71 story tree | REQ-88, REQ-93 (repro side) | **gap** — `1c repro` is expressed by no story anywhere in the 25-story matrix (finding 7). |
| CAP-73 (`capability-8108afab`) | — | correctly `deprecated`, `merged_into: capability-2049c9ec`; holds zero stories. No exclusivity conflict. |
| STORY-84 ↔ STORY-86 | — | exclusivity OK — clean fold/gate split with explicit reciprocal out-of-scope clauses; no overlapping intent. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-84 | story-body-edit | Story body states each node carries "its authored axes, **a geometry keyframe per sampled width**" — i.e. only geometry is keyframed. AC-691 makes it explicit: "A node's authored typography axes are taken from its **widest present sample** (the desktop rendering)." That is verbatim the root cause BUG-18 (free_and_reconciled) diagnosed and fixed: "`foldToL1` takes a text run's axes from the widest present cell only … Only `geometry` is keyframed per width; flat axes are not." The fix shipped — `responsiveTextTracks` at `tools/generate/src/l1/fold.ts:621`, applied at `fold.ts:1745` (`node.responsive`), emitting per-width fontSizePx/lineHeightPx/letterSpacingPx tracks for axes that vary. The matrix currently describes the bug, not the fix. | Amend the body: flat text axes that vary across the ladder fold to a per-width scalar track alongside geometry; static axes stay single-valued. Downstream: edit AC-691's "widest present sample" sentence and add an AC for the responsive scalar track. |
| 2 | violation | coverage | STORY-84 | story-body-edit | BUG-17 (free_and_reconciled) added a node-level `padding` axis and required the fold to carry captured per-side padding onto text/image/box leaves. Shipped as `foldPadding()` (`fold.ts:550`, applied at `fold.ts:1748`, `:1876`, `:1918`) plus `responsivePaddingTracks()` (`fold.ts:655`, applied at `:1752`, `:1880`, `:1922`). The word "padding" appears nowhere in STORY-84's body, and no AC lists it — AC-730's surface-axis enumeration (fill/gradient/border/shadow/radius/opacity/backdrop-blur/blend) and AC-729's image-axis list (object fit, radius, opacity, blend, border, shadow) both omit it. | Add padding (and its per-width track) to the body's account of what a folded leaf carries. Downstream: `ac-add` for padding folding, or extend AC-729/AC-730/AC-691's axis lists. |
| 3 | violation | coverage | STORY-84 | story-body-edit | BUG-20 (free_and_reconciled) landed "the fold folds a chip run's own surface onto its text leaf, and drops its card row so the pill is not also duplicated as a box behind it", discriminated by pill saturation (radius ≥ half the run's painted height). Shipped as `isSelfPaintingRun`/`chipAxes` (`fold.ts:939–944`), applied at `fold.ts:1726–1729` and `:1765–1769`. STORY-84's text-leaf bullet lists only typography + text pixel-movers (gradient fill, decoration, small-caps, list marker, text shadow) — no self-surface. AC-730 covers only a "**text-free** element that paints a standalone surface", which is the opposite case. | Add the fused text+surface (chip/badge) case to the body: a text-bearing run that paints its own saturated-pill surface folds that surface onto its text leaf and emits no duplicate backing box. Downstream: `ac-add`. |
| 4 | violation | coverage | STORY-84 | story-body-edit | BUG-19 (free_and_reconciled) added a second band-seeding rule: a full-bleed **bar** (footer/nav strip) whose same-fill, no-treatment runs are individually narrow and horizontally distributed, whose union spans full content width and whose largest internal gap is dominant — distinguished from an evenly-tiled card grid. Shipped as `barBandFills()` (`fold.ts:1276`, applied at `fold.ts:1956`, `:1960–1962`). AC-731 states only the single dominant-fill rule ("The solid fill that the greatest number of runs sit on becomes the folded document's background band"), which is exactly the rule BUG-19 showed misses a bar. | Add the bar-detection rule to the body's surface-reconstruction account. Downstream: `ac-edit` on AC-731 or a new AC. |
| 5 | violation | consistency | STORY-84 | story-body-edit | BUG-14 (free_and_reconciled) required "Reconstruct the hierarchy … full-width section-band boxes → card boxes (their own fill/shadow/border/radius/padding) → text. **Nest, don't flatten**" and "**Stop per-run boxing**". STORY-84's body still describes the flat per-run model it retired: "every run whose surface differs from the band … gets a backing box emitted before the content". AC-731 encodes it more explicitly — "Every run whose composited surface differs from that band … folds an **additional backing box leaf** carrying that fill/gradient and **the run's geometry**". The code implements the hierarchy instead: rows are partitioned into band rows and card rows and grouped via `buildSolidBands`/`buildCards` (`fold.ts:1939–1995`), with section-edge clamping, not one box per run. | Rewrite the surface-reconstruction paragraph in terms of section-band → card → text reconstruction with grouped card boxes and section-edge clamping. Downstream: `ac-edit` on AC-731. |
| 6 | violation | coverage | STORY-84 | story-body-edit | BUG-23 (free_and_reconciled) — a reproduction that hotlinks the captured origin "is not a reproduction" and blinds the perceptual gate. `localizeAssets(doc, assets)` (`tools/generate/src/l1/assets.ts:58`) binds `image.src`, `box.axes.backgroundImageUrl` and `doc.resources.fonts[].src` to the bundle's mirror, and an unmirrored handle **fails the import outright** (`cli/repro.ts`, BUG-23 block). STORY-84 says an image leaf carries "its resolved source", and AC-729 pins that down as "the source URL **resolved at capture time**" — the pre-fix remote-URL behaviour (`fold.ts:865` confirms the fold still emits the origin URL and relies on `localizeAssets` to rewrite it). No AC covers the mirror binding or the hard failure. | State in the body that asset-bearing axes are bound to the bundle's mirror and that an unmirrored handle is a hard failure, not a fallback. Downstream: `ac-edit` on AC-729 plus an `ac-add` for localization/refusal. |
| 7 | violation | coverage | CAP-71 story tree | story-body-edit | REQ-88 (free_and_reconciled) delivered **`1c repro <slug> --ref <bundle>`** — "writes a site whose home page *is* the bundle's folded L1 document, and mirrors the bundle's assets into the draft", idempotent, and refusing a bundle whose `l1.json` seams and REQ-93 `forms.json` bindings disagree (`tools/generate/src/cli/repro.ts:95`, `cli/index.ts:527`). Its sibling verbs are covered — `cmdRefold` ← AC-814, `cmdL1Gate` ← STORY-86 AC-708 — but `cmdRepro` is expressed by **no story in the matrix** (all 25 story titles/bodies checked; the nearest, STORY-93, covers `1c new` scaffolding per REQ-102, not bundle import). REQ-88 frames it as "closing the last gap between the L1 library and an operator workflow", squarely inside this capability's declared `capture → fold → render → gate` scope. Also unexpressed: REQ-88's `nowrapFromPx` line-count axis, folded at `fold.ts:1736`. | Express the bundle→site import step in STORY-84's body (or author a sibling story under CAP-71 for the operator-facing pipeline). See placement note below. |
| 8 | warning | consistency | STORY-86 | story-body-edit | STORY-86's Out-of-scope names "the fold itself, including which residuals it emits (**CAP-71**)" and its Dependencies name "Plan item 2 — Capture → L1 Fold + Structural Hints (**CAP-71**)". Since the 2026-08-05 structural rebalance merged CAP-73 into CAP-71, STORY-86 *lives in* CAP-71 — so these now read as the story excluding and depending on its own capability. | Re-point both references at STORY-84 (the fold story) rather than CAP-71. |
| 9 | info | — | CAP-73 (`capability-8108afab`) | — | Correctly `deprecated` with `merged_into: capability-2049c9ec` and zero stories, so there is no live exclusivity conflict. Its body still claims "It could not be set to `status: deprecated` in this run" — stale text on a deprecated ticket, outside this capability's scope. | none |
| 10 | info | — | BUG-25 | — | BUG-25 (multi-line runs sharing one box) constrains the fold's absolute positioning, but its acceptance is stated on the **capture manifest** ("No two text runs in a capture manifest share an identical `renderedTextBox`"), which CAP-63 owns. Not counted as a CAP-71 coverage gap. | none |

## Notes for the Editor

**The cross-cutting pattern is one wave, not six unrelated misses.** Findings 1–6
are all BUNDLE-10 (`bundle-4ff83a8b`, 2026-08-05) — the fold-fidelity wave driven
by the first real reproductions (gigabytealchemy.ai, joyfulculinarycreations.com).
Neither story records that bundle in its attribution chain: both carry
`intent_uid: bundle-31e474b9` (BUNDLE-7) and `updated_by: bundle-ee56a66e`
(BUNDLE-11), skipping BUNDLE-8 and BUNDLE-10 entirely. BUNDLE-11's reconciliation
appears to have updated the story for its *own* intents (REQ-94, REQ-96, BUG-27 →
AC-812/813/852–856) without back-filling the BUNDLE-10 fold changes. Repairing
findings 1–6 is best done as one pass over STORY-84's "The fold emits the full
language" section rather than six separate edits.

**Two findings are contradictions, not just omissions**, and should be prioritised:
AC-691's "typography axes are taken from its widest present sample" (finding 1) and
AC-731's per-run backing-box model (finding 5) each state as the criterion the exact
behaviour BUG-18 and BUG-14 were filed to remove. A UAT written faithfully against
either AC would assert the pre-fix behaviour and fail against current code.

**Placement question for finding 7.** `1c repro` is unexpressed matrix-wide — that
much is not in doubt. Where it belongs is a judgement call the editor should make
explicitly rather than inherit: CAP-71's scope line reads `capture → fold → render →
gate`, and REQ-88 positions `repro` as the adapter that lets `render/serve/shot/diff`
operate on a folded document, which argues for CAP-71. The counter-argument is that
writing a site draft is site-authoring/materialization rather than fold-or-gate. If
CAP-71 takes it, note that CAP-71's own Out-of-scope section does not currently
mention it either way, so the scope statement needs a line too. REQ-93's `l1.json` ↔
`forms.json` seam-consistency refusal (also in `cmdRepro`) travels with this
decision.

**STORY-86 needs no coverage work.** Every reconciled gate intent traces to a live
AC; only the stale self-referential CAP-71 pointers (finding 8) need touching.

**Verification performed.** Every claim above was checked against current code in
this worktree (`regression-5096fbee`), not inferred from ticket text: `foldPadding`,
`responsivePaddingTracks`, `responsiveTextTracks`, `chipAxes`/`isSelfPaintingRun`,
`barBandFills`, `buildSolidBands`/`buildCards`, `localizeAssets`, `cmdRepro`/
`cmdRefold`/`cmdL1Gate`, and the confirmed absence of `adopt-values` (AC-696 holds).
