---
uid: report-79f985a4
id: REPORT-391
type: report
title: 'Reconciliation Review: BUNDLE-3 (commits) — 8 stories, 47 delta ACs'
created_by: xgd
created_at: '2026-07-09T23:42:59.177639+00:00'
updated_at: '2026-07-09T23:42:59.177639+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-adc60ee8
  anchor_uid: bundle-adc60ee8
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits (23 free-coded commits)
**Surface**: — (commits mode)
**Anchor**: bundle-adc60ee8
**Subject (intent)**: bundle-adc60ee8 (type=bundle — used directly)
**Stories Reviewed**: 8

## Method

Read the full intent (bundle body: REQ-26/27/28/20/31/32/33/35/37/38, ~59K chars, incl. each REQ's "Implementation (as landed)" notes) first, then read the code (module sources + tooling) and the reconciliation UATs, then the 8 stories. Ran the 8 BUNDLE-3 reconciliation UAT files: **47 tests, all passing** (6.6s). Confirmed AC→UAT coverage is 1:1 across the delta and spot-checked evidence validity for the highest-claim suites.

## Behavior Inventory (grouped by capability bucket)

~40 distinct behaviors across three capabilities. Every framework behavior is a new dial / variant / palette-role / treatment on an *existing* module or the theme-token generator (CLAUDE.md generalize-first); the only genuinely new surface is the vision/tooling CLI (values-diff, perceptual diff, launcher).

- **CAP-51 chrome (STORY-55)**: hero headingTreatment/height/subhead/scrim/contentAnchor; header align/logoSize/xl-spacing/display-wordmark; footer layout; generalized {direction,stops[]} gradient text treatment; expanded palette roles (secondary/neutralCool/accentLight/accentDeep/accentMid).
- **CAP-51 content (STORY-56)**: services-grid accent/badge/checklist/surface + stacked variant + size dials; contact-form width(full/half)+fc-row grouping + submitTreatment + font:inherit; markdown GFM-alert callouts + smartypants-off verbatim; recursive itemSchema/enum content-contract validation.
- **CAP-53 background (STORY-59)**: background×surface precedence rule (background paints, surface contracts).
- **CAP-53 layer (STORY-60)**: text typography + `lines` titled-block; image shadow/border/feather; transform-origin/circle/box-mask geometry; link underline offset; xl shadow token.
- **CAP-52 capture (STORY-57)**: per-element computed values (lineHeight/letterSpacing/text-fill gradient/left-bar/padding); section scrim + content-anchor ratio; colorInferred sentinel.
- **CAP-52 NEW values-diff (STORY-62)**: manifest projection, field + section severity-ranked diff, casing delta, per-metric tolerances/strict/inferred-colour, offline --actual, exit semantics.
- **CAP-52 NEW perceptual diff (STORY-63)**: 1c diff (heatmaps + connected-component regions.json + crop triptychs) + 1c crop.
- **CAP-52 NEW launcher (STORY-64)**: bin/1c location-independent launcher, CWD preservation, server.ws:false quiets HMR-port collision.

## Coverage Map (delta behaviors)

| # | Behavior | Coverage | Story | UAT |
|---|----------|----------|-------|-----|
| 1 | hero headingTreatment independent of surface | Covered | story-a224111f | AC-502 |
| 2 | hero height/markdown subhead/subheadColor+size/scrim/contentAnchor | Covered | story-a224111f | AC-503 |
| 3 | header align/logoSize/xl-spacing/display wordmark (true weight) | Covered | story-a224111f | AC-504 |
| 4 | footer layout(center/spread) | Covered | story-a224111f | AC-505 |
| 5 | multi-stop any-direction gradient text treatment | Covered | story-a224111f | AC-506 |
| 6 | expanded palette roles (defaulted, backward-compatible) | Covered | story-a224111f | AC-507 |
| 7 | services-grid accent/badge/checklist/surface | Covered | story-903e3e3a | AC-508 |
| 8 | services-grid stacked variant + grid/per-card size | Covered | story-903e3e3a | AC-509 |
| 9 | ✓ checklist is a real text run (not ::before) keyed to status colour | Covered | story-903e3e3a | AC-510 |
| 10 | contact-form half-width fc-row grouping | Covered | story-903e3e3a | AC-511 |
| 11 | contact-form submitTreatment + font:inherit | Covered | story-903e3e3a | AC-512 |
| 12 | markdown GFM-alert callout left-bars @ medium weight | Covered | story-903e3e3a | AC-513 |
| 13 | markdown verbatim (smartypants off) | Covered | story-903e3e3a | AC-514 |
| 14 | recursive itemSchema/enum content validation, dotted paths | Covered | story-903e3e3a | AC-457 |
| 15 | background+surface compose (background paints, surface contracts) | Covered | story-6af935e7 | AC-515 |
| 16 | surface-only band unaffected | Covered | story-6af935e7 | AC-516 |
| 17 | layer text-child token-backed typography | Covered | story-4f50c054 | AC-517 |
| 18 | layer `lines` titled-block, fixed gap | Covered | story-4f50c054 | AC-518 |
| 19 | layer image shadow + border | Covered | story-4f50c054 | AC-519 |
| 20 | layer soft-mask feather control | Covered | story-4f50c054 | AC-520 |
| 21 | layer geometry (transform-origin/circle/box-mask) | Covered | story-4f50c054 | AC-521 |
| 22 | capture per-element computed values | Covered | story-8f33f14c | AC-522 |
| 23 | capture section scrim + content anchor | Covered | story-8f33f14c | AC-523 |
| 24 | capture colorInferred sentinel; new fields optional | Covered | story-8f33f14c | AC-524 |
| 25 | values-diff severity-ranked report | Covered | story-f826e5ca | AC-525 |
| 26 | per-element field deltas by property | Covered | story-f826e5ca | AC-526 |
| 27 | casing delta; whitespace ignored | Covered | story-f826e5ca | AC-527 |
| 28 | section overlay/anchor deltas by ordinal | Covered | story-f826e5ca | AC-528 |
| 29 | delta ranking (content/structural > measurement) | Covered | story-f826e5ca | AC-529 |
| 30 | perceptual colour tolerance (near-neighbour flagged) | Covered | story-f826e5ca | AC-530 |
| 31 | jitter tolerances + strict + per-metric flags | Covered | story-f826e5ca | AC-531 |
| 32 | inferred reference colour never hard delta | Covered | story-f826e5ca | AC-532 |
| 33 | offline --actual short-circuit | Covered | story-f826e5ca | AC-533 |
| 34 | repeated texts FIFO pairing | Covered | story-f826e5ca | AC-534 |
| 35 | output forms + exit status | Covered | story-f826e5ca | AC-535 |
| 36 | 1c diff shoots draft, emits heatmaps/regions/summary | Covered | story-1570884a | AC-536 |
| 37 | 1c diff --actual PNG offline | Covered | story-1570884a | AC-537 |
| 38 | common top-anchored crop of mismatched dims | Covered | story-1570884a | AC-538 |
| 39 | per-pixel + block-averaged heatmaps | Covered | story-1570884a | AC-539 |
| 40 | summary mean/pct/band profile | Covered | story-1570884a | AC-540 |
| 41 | connected-component scored regions | Covered | story-1570884a | AC-541 |
| 42 | region crop triptychs | Covered | story-1570884a | AC-542 |
| 43 | exit code + --json reflect regions | Covered | story-1570884a | AC-543 |
| 44 | 1c crop bounds-clamped box | Covered | story-1570884a | AC-544 |
| 45 | launcher runs CLI from any CWD (own-location resolution) | Covered | story-5c2f2faa | AC-545 |
| 46 | launcher preserves caller CWD for path resolution | Covered | story-5c2f2faa | AC-546 |
| 47 | launcher clean when HMR port occupied | Covered | story-5c2f2faa | AC-547 |

No Partial or Uncovered behaviors within the intent's declared scope.

## Ungrounded Stories

None. Every story documents behavior supported by both intent and code. Two intentional generalizations were verified as faithful supersets, not invented behavior:
- STORY-56 documents the markdown callout as a **shared markdown-renderer** treatment ("available in any markdown body") rather than the intent's literal "`text-block` treatment" (REQ-32 cap 2). The code implements the shared-renderer form; the story documents the code accurately and the text-block callout case is a subset. Faithful.
- STORY-55 folds the header `overlay` variant and `logoFont`/`logoTreatment` (prior BUNDLE-2 work, REQ-24/25) into the cumulative story state alongside the BUNDLE-3 dials. Consistent with reconciliation documenting current code state.

## Plan Item Accounting

| Plan Item | Type | Expected Story | Status |
|-----------|------|---------------|--------|
| 1. Chrome modules + palette roles + gradient | upgrade | story-a224111f (STORY-55) | ✓ |
| 2. Content modules + content-contract validation | upgrade | story-903e3e3a (STORY-56) | ✓ |
| 3. Background + surface composition | upgrade | story-6af935e7 (STORY-59) | ✓ |
| 4. Layer art-direction treatments | upgrade | story-4f50c054 (STORY-60) | ✓ |
| 5. Capture per-element values + scrim/anchor | upgrade | story-8f33f14c (STORY-57) | ✓ |
| 6. Mechanical values-diff | feature | story-f826e5ca | ✓ |
| 7. Perceptual-diff eye (1c diff + crop) | feature | story-1570884a | ✓ |
| 8. 1c launcher + quiet SSR server | feature | story-5c2f2faa | ✓ |

All 8 plan items produced their story. None dropped.

## Evidence Sufficiency (Step 5b)

All 47 delta ACs (AC-457, AC-502–AC-547) have a passing, named `test_UAT_AC<N>_*` reconciliation UAT. Ran the 8 BUNDLE-3 reconciliation suites: **47 passed / 0 failed**.

Evidence validity spot-checks — all clean:
- **Real entry points**: framework ACs render through Astro's container API (the same SSR path `tools/generate` uses) and, for pipeline/CSS-assembly claims, through the real `cmdNew`+`cmdRender` pipeline reading `theme.css`/`index.html` on disk. Tooling ACs drive the real `1c` CLI (values-diff/diff/crop) and, for the launcher, spawn the real `bin/1c` shell script as a subprocess.
- **No internal mocking**: `grep` for `vi.mock` across all reconciliation UATs returns nothing; only external boundaries (temp dirs, network port bind, browser fixtures) are stubbed.
- **No source-inspection-only tests**: no UAT proves a behavior solely by reading `.ts`/`.astro` source text. Where Astro's container API drops a module's scoped `<style>`, the *behavioral* discriminator is always asserted against rendered HTML or the on-disk generated stylesheet (e.g. AC-510 matches an actual `<span…>✓</span>` in the DOM and asserts absence of `::before`; AC-511/513 render a full site and read `theme.css`); a secondary `moduleSource()` check only corroborates the specific colour-var wiring. This is layered on top of real runtime observation, not a substitute for it.
- **Discriminating assertions**: UATs assert specific observable outcomes that fail if the behavior is removed — e.g. AC-546 proves CWD-relative resolution by showing the *same* launcher command yields a populated site list from the repo root and `(no sites)` from a nested dir (a fixed-`cd` launcher would fail this); AC-530 keeps the flagship near-neighbour-gold flag while suppressing imperceptible rounding.

## Judgment Calls

- **REQ-20 / REQ-33 / REQ-21 milestone site reproductions produce no stories** — correct. Their `storage/sites/*` edits are free-coding-exempt config/site-def (evidence the dials work), not matrix behavior. The framework primitives those imports *drove* are folded into the module upgrades they belong to. Not a coverage gap.
- **Deferred/known-issue items** (REQ-32 layer percentage-position cross-browser) were investigated and downgraded to a likely-cache non-issue ("could not reproduce" across WebKit/Gecko) — correctly absent from story behavior.
- **REQ-38 out-of-scope items** (ignore-region mask, auto-fix worker loop, SSIM) — correctly not claimed by STORY-63.
- The `moduleSource()` CSS corroboration (above) is an acceptable known-limitation workaround, not a materiality gap: the developer's mental model from these stories matches what the code renders.

## Verdict

**PASS**: Stories faithfully and completely document the operator's stated intent (bundle body + landed-implementation notes) and the code's behavior. Divergences: none — the two intentional generalizations are faithful supersets, transparently documented. All 8 plan items produced output. All 47 active delta ACs have passing UATs that enter through real user-relevant interfaces, mock no internal code, and assert distinguishing observable outcomes — a broken implementation could not pass them. A developer reading these stories would have an accurate mental model of what this bundle intended to build and what the code does.
