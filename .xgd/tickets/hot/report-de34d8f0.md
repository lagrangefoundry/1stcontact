---
uid: report-de34d8f0
id: REPORT-2452
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (uat) — attempt 8'
created_by: xgd
created_at: '2026-08-20T14:20:29.183340+00:00'
updated_at: '2026-08-20T14:20:29.183340+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: uat
  fixes_applied: 8
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (uat)

**Attempt**: 8
**Fixes applied this call**: 8
**Violations remaining**: 0
**Needs more work**: false

Both findings from report-028c1de3 are closed in `tests/reconciliation-l1-fold-measured-axes.test.ts`.
No production code was changed — `git status` shows exactly one modified file.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1352 | Added two **card-shaped** rows to the `heroPage` fixture: `Card copy` (`#f4f0ea`, 260px wide, `y = height + 260` → travels with the viewport) and `Badge copy` (`#ffe9c7`, 180px, `y = 200` → pinned in the hero's top half). Both are far under `FULL_WIDTH_FRAC * pageContentWidth`, so each folds to its own `card-*` box rather than joining a band |
| 2 | uat-edit | AC-1352 | Added a `cardWith(doc, fill)` helper — cards are named by paint order (`buildCards` sorts by area), so the surface fill is the stable handle |
| 3 | uat-edit | AC-1352 | Asserted **attribution rule 2**: `responseOf(cardWith(doc, '#f4f0ea'))?.yFactor === 1` (the card inherits its representative row's response) contrasted against `responseOf(cardWith(doc, '#ffe9c7')) === undefined` (a card whose row does not move carries none) |
| 4 | uat-edit | AC-1352 | Added the `threeSectionPage(contentHeightAt)` fixture — three sections whose lower two edges travel at **1×** and **2×** the viewport delta (the probe stretches section 2's own height), so the band's own content height decides which edge closes it at each width |
| 5 | uat-edit | AC-1352 | Asserted the **band-disagreement refusal**: with a uniform 580px content height every width closes on the 2× edge and the band folds `{ yFactor: 1, heightFactor: 1 }`; with 280px at 320/375 and 580px above, the narrow rungs close on the 1× edge and the wide ones on the 2× edge, and the band carries **no** response rather than the first sample's |
| 6 | uat-edit | AC-1351 | Asserted the residual-inset clause's consequence: `evaluateLayout(grid, 767)` — an unsampled width just below the breakpoint — places the third tile on the column origin (`\|x - originOf(767)\| ≤ 1`), its right edge inside the viewport, and the evaluation reports **no** `clip` finding |
| 7 | uat-edit | AC-1351 | Asserted the **two-distinct-extents guard**: a `maxWidthPx: 272` cap that bites at every ladder width gives one extent, and no anchor is fitted (nor is the column carried, since nothing refers to it); the same page at `maxWidthPx: 320` gives two extents and both axes resolve to `{x: {px:0,fraction:0}, width: {px:0,fraction:1}}`. The pair differs only in how many extents the samples showed |
| 8 | uat-edit | AC-1351 | Asserted the plausible-share clause's render half: `evaluateLayout(steep, w)` at 600 / 900 / 1150 keeps the refused run inside the 200px…500px envelope its own samples described, instead of extrapolating the steep coefficient outwards |

Supporting: imported `evaluateLayout` from `../tools/generate/src` (already exported and used by `tests/reconciliation-3probe-gate-evaluator.test.ts`).

## Mutation Evidence — the new assertions bite

Each new clause was verified by temporarily mutating the production code it protects and
confirming the test goes red; `fold.ts` was restored from a byte-for-byte backup after each
run (`git diff --stat tools/generate/src/l1/fold.ts` is empty).

| Mutation | Result |
|---|---|
| Delete `fold.ts:1685-1688` (`const cardResponse = …; if (cardResponse) geometry.viewportResponse = cardResponse`) | **FAIL** — `expected undefined to be 1` at the `card-*` `yFactor` assertion. This was the exact deletion report-028c1de3 showed leaving the whole suite green |
| Weaken `fold.ts:1572` from `if (first && responseSamples.every(…))` to `if (first)` | **FAIL** — `expected { yFactor: 1 } to be undefined` at the disagreeing-band assertion |
| Delete the `fitAnchor` guard `if (new Set(extents.map(Math.round)).size < 2) return undefined` (`fold.ts:468`) | **FAIL** — the one-extent page anchors when it must not |
| Delete `if (segments) track.segments = segments` in the residual-inset branch (`fold.ts:531`) | **FAIL** — the segment-inheritance assertion the new off-sample check depends on |

## Code Edits (if any)

None. `fold.ts:1685-1688` and `fold.ts:1572-1579` were confirmed correct on inspection and
are now protected by tests rather than altered.

## Test Execution Evidence

```
npm test -- tests/reconciliation-l1-fold.test.ts tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-l1-fold-measured-axes.test.ts tests/reconciliation-l1-seam-config-and-repro.test.ts \
  tests/reconciliation-3probe-gate.test.ts tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts
→ Test Files 9 passed (9) · Tests 42 passed (42)
```

All 42 AC-named UATs still pass together; nothing regressed.

## Scope notes

- Two clauses of AC-1351's Verification were **narrowed to what the fixture can honestly
  show**, and this is worth the assessor's eye:
  - The report suggested asserting the third tile "stays inside the viewport" *and* an exact
    stacked geometry. At 767 the tile's **width** is 327px (the 375-rung value held by the
    `snap` segment), not `extentOf(767) = 719`. The width axis has no closed form and is
    keyframed, so a snap holding the lower rung is the fold's documented behaviour. The
    assertion therefore pins the **left edge** (which the residual inset does control) and
    the right-edge/no-clip consequence AC-1351 actually names, not a width the criterion
    does not claim.
  - The one-extent fixture refuses **both** axes, not just the width. `fitAnchor`'s guard
    (`fold.ts:466-468`) sits above the per-axis split, and with a single extent the left
    edge is under-determined too. The report's suggested wording ("no width anchor is
    fitted") reads as if the x anchor would survive; it does not, and the test asserts what
    the code does — with an adjacent two-extent fixture proving the refusal is the guard
    rather than a failed column fit.
- Finding 3 (info, FC/AC mirroring) and finding 4 (info, sandbox `EPERM` on the wildcard
  bind in `tests/req88-form-labelling-and-submit.test.ts`) were recorded, not acted on —
  neither is a defect and neither touches an AC-named UAT of this capability.
- AC-1352 and AC-1351 already carried `uat_coverage: pass`; no ticket field changes were
  needed.

## needs_review Items Forwarded

None.
