---
uid: report-dc389d54
id: REPORT-3753
type: report
title: 'Fix UAT Coverage: L1 Reproduction Pipeline: Fold & Acceptance Gate — attempt
  7'
created_by: xgd
created_at: '2026-09-10T15:50:17.068472+00:00'
updated_at: '2026-09-10T15:50:17.068472+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_uat_coverage
  subject_uid: capability-2049c9ec
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix UAT Coverage: L1 Reproduction Pipeline: Fold & Acceptance Gate

**Attempt**: 7
**Fixes applied**: 3 (all three violations)
**Violations remaining**: 0
**Needs more work**: false

All nine reconciliation suites plus the four re-attributed free-coded suites were
run after the edits:

```
npm test -- tests/reconciliation-l1-fold.test.ts \
  tests/reconciliation-l1-fold-responsive-axes.test.ts \
  tests/reconciliation-l1-bundle-materialization.test.ts \
  tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts \
  tests/reconciliation-3probe-gate.test.ts \
  tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts \
  tests/bug19-fold-bar-band-fill.test.ts tests/bug20-chip-self-surface.test.ts \
  tests/bug21-control-surface-outset.test.ts tests/req88-surface-shape-and-fontface.test.ts

  → 13 files passed, 76 passed | 1 skipped (77)
```

The one skip is deliberate and is finding 3's fix: the Chromium-gated extraction
probe now *declares* itself skipped instead of returning early and reporting green.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-731 | Re-attributed 10 free-coded UATs (BUG-19 / BUG-20 / BUG-21 / REQ-88, all `free_and_reconciled`) from `test_UAT_FC_*` to `test_UAT_AC731_*`, per the one-authoritative-location rule and `fc_orphan_check`'s stated post-reconciliation convention. No test bodies changed; no second copy authored |
| 2 | uat-add | AC-731 | Authored 4 new UATs in `tests/reconciliation-l1-fold-full-language.test.ts` proving the page-base ordering chain the AC states — extent over count, band → run-count → canvas, and backdrops counting toward the extent |
| 3 | uat-edit | AC-694 | Split the engine half out of `test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar` into a declared `it.skipIf(!HAS_CHROMIUM)` case, extended it to `parentId` / `position` / `repeatCount`, and added an always-run derivation probe that executes the shipped `HINTS_SCRIPT` over a real document |
| 4 | field | AC-731, AC-694, STORY-84 | `uat_coverage` set to `pass` |

### Finding 1 — AC-731's three uncovered clause-clusters, re-attributed

The evidence existed; it was attributed to the free-coded intents rather than to
the AC that reconciled them. Renamed in place (test bodies untouched):

| Clause | File | Tests re-attributed |
|---|---|---|
| (a) self-painting run — pill radius ≥ half painted height (BUG-20) | `tests/bug20-chip-self-surface.test.ts` | `..._badge_run_folds_to_a_text_leaf_carrying_its_own_pill`, `..._chip_paints_once_no_duplicate_badge_box_behind_it`, `..._a_modestly_rounded_single_run_card_is_not_a_chip` |
| (a) self-painting run — authored vertical inset; accent/gradient keeps the backing box (BUG-21) | `tests/bug21-control-surface-outset.test.ts` | `..._padded_control_surface_matches_its_captured_box_at_every_width`, `..._no_outset_card_box_is_emitted_behind_a_padded_control`, `..._a_padded_run_carrying_an_ancestor_accent_stays_on_the_card_path` |
| (b) full-bleed bar seeds a band; evenly-tiled grid stays cards (BUG-19) | `tests/bug19-fold-bar-band-fill.test.ts` | `..._distributed_bar_runs_become_a_full_bleed_band`, `..._evenly_tiled_card_grid_stays_cards_not_a_band`, `..._navy_band_paints_full_width_in_the_render` |
| (c) captured surface rect is the backing box's geometry, radius and grouping identity (REQ-88 round-5) | `tests/req88-surface-shape-and-fontface.test.ts` | `..._a_card_adopts_the_captured_surface_rect_and_radius` (two runs on one rect merge, captured radius), `..._sibling_panels_sharing_no_surface_stay_separate_and_aligned` (different rects never merge), `..._a_full_viewport_surface_is_a_band_so_the_run_keeps_its_own_box` |

Deliberately **not** re-attributed: `test_UAT_FC_BUG-19_gigabytealchemy_footer_folds_to_a_navy_band`
and `test_UAT_FC_BUG-20_real_gigabytealchemy_badges_fold_as_pills`. Both `return`
early when the gitignored third-party capture is absent — importing a silently
skipping test into AC-731's evidence would reproduce exactly the defect finding 3
is about. They stay as corroborating free-coded probes.

### Finding 2 — the page-base ordering chain, newly authored

Four probes added to the `AC-731` describe in
`tests/reconciliation-l1-fold-full-language.test.ts`. Each makes the extent rung
and the count rung *disagree*, which the previous fixture could not (its tallest
band and its most-common run fill were the same colour):

| Test | Fixture | Discriminates |
|---|---|---|
| `test_UAT_AC731_page_base_is_the_tallest_band_not_the_most_common_run_fill` | one 520px `HERO` band run vs three 40px `STRIPE` band runs | count says STRIPE (3 v 1), extent says HERO (520 v 160) → asserts HERO, and asserts both fills really did reconstruct bands so the probe is not vacuous |
| `test_UAT_AC731_page_base_falls_back_to_the_most_common_run_fill_when_no_band_is_reconstructed` | four shadowed (therefore treated, therefore never band-fill) panels, 3 × `CARD` + 1 × `ODD`, with a distinct canvas fill present | asserts zero bands, `CARD` wins, and the canvas is **not** reached while a run fill survives |
| `test_UAT_AC731_page_base_falls_back_to_the_captured_canvas_fill_as_a_last_resort` | runs with no composited surface at all + `bodyBackground` | asserts the third rung, and that it renders as the body background |
| `test_UAT_AC731_a_captured_backdrop_counts_towards_the_page_base_extent` | a full-bleed textless backdrop (900px) + two shadowed nested panels + a distinct canvas | BUG-27: the backdrop is the only full-bleed paint; asserts `DEEP` over both the more-common `CARD` run fill and the canvas |

Verified against `tools/generate/src/l1/fold.ts:2107-2148` — the three rungs are
`bandHeightByFill` (bands ∪ backdrops), then most-common `surfaceRows` fill, then
`manifest.bodyBackground`.

### Finding 3 — AC-694's silent Chromium return

Three-layer structure now, in `tests/reconciliation-l1-fold.test.ts`:

1. **Contract** (unchanged, always runs) — `test_UAT_AC694_capture_emits_advisory_structural_hint_sidecar`
   still proves capture → `hints.json` → `readHints` over `FakeDriver`. Its
   closing comment now says plainly that it does *not* prove derivation.
2. **Derivation** (new, always runs) — `test_UAT_AC694_structural_hints_are_derived_from_a_real_document`
   evaluates the shipped `HINTS_SCRIPT` in page scope over a real parsed
   document (jsdom, `runScripts: 'dangerously'`). All six dimensions are computed
   by the extractor, not handed to it: ancestry from the real DOM walk
   (`div → section → body`, body root), parent layout from the real cascade
   (`flex` / `space-between` / `gap: 24px`, `null` on the non-flex parent),
   authored sizing unit from the real matched-`cssRules` scan (`percent` survives
   even though the computed value is px; the `.pin` sibling reports `px` on the
   same run), `position` per node (2 static / 1 absolute), `repeatCount` (2 for
   the `.col` pair, 1 for the lone `.pin`), and `mediaBreakpoints` `[600]` from
   the real `@media` rule.
3. **Engine accuracy** (declared skip) — `it.skipIf(!HAS_CHROMIUM)('test_UAT_AC694_structural_hints_extracted_by_a_real_engine')`.
   `HAS_CHROMIUM` is resolved once at module scope via top-level await, so an
   unrun branch shows as `↓ skipped` in the run summary instead of green. The
   assertions were extended to the three dimensions that were previously asserted
   on neither path: `parentId` (the `.col`/`.pin` children name the `.row`
   section), `position` (2 static / 1 absolute) and `repeatCount` (2).

The fixture HTML is now a shared `HINTS_FIXTURE_HTML` const so the derivation and
engine probes read the same page. `.col` carries an explicit `position: static`
(jsdom's `getComputedStyle` returns `''` for an undeclared `position`; Chromium
returns `static` either way), so the same assertion is meaningful on both paths.

**Why jsdom rather than a wholly-gated probe.** The assessor listed the in-process
DOM as optional. It is worth taking: jsdom supplies a real cascade, real
`document.styleSheets.cssRules`, real `el.matches`, and a real element tree, which
is exactly what five of the six dimensions are derived from. Its one gap is layout
— `getBoundingClientRect()` is all-zero, so the script's own `visible()` gate would
reject every node. The rect and `documentElement.scrollWidth/scrollHeight` are the
only prosthetics, and `box` is not one of the six dimensions; no assertion in the
probe reads it. This turns AC-694 from wholly environment-gated into an AC with
always-run derivation evidence plus a visibly-skipped accuracy probe.

Chromium remains unavailable in this sandbox (Mach bootstrap denial), so layer 3
did not execute this session — which is now *reported* rather than hidden.

## Note on the re-attribution's side effect

BUG-19, BUG-20, BUG-21 and REQ-88 are all `free_and_reconciled`, and
`xgd_source/cli/workflows/definitions/fc_orphan_check.yaml` states that FC tests
must be renamed to `test_UAT_AC<N>_<slug>` once their intent is reconciled — so
this is the sanctioned direction, not a loss of evidence. It does mean those four
intents no longer resolve UATs through their `test_UAT_FC_<TICKET-ID>` scope
token for the renamed cases; each intent retains FC-named probes — BUG-19 keeps 1
(its real-capture footer probe), BUG-20 keeps 9 (including the whole diff-side
half, which belongs to the capture & diff capability, not this one), BUG-21 keeps
4, and REQ-88 keeps 4 here plus 8 in `tests/req88-surface-attribution.test.ts`.

## Code Edits

None this call. Only test files and three `uat_coverage` fields were touched; no
production source changed.

## needs_review Items Forwarded

None. The report recorded `needs_review_count: 0` and nothing surfaced during the
work.

## Warning carried forward (finding 4, informational)

AC-1625…AC-1631 and AC-1630 still carry `status: pending` rather than `active`.
Untouched here, as the report says: not this workflow's field. Coverage is
unaffected — all eight have substantive passing UATs — but whichever stage owns AC
`status` promotion should promote them before a downstream aggregate under-counts
the capability.

## Consider for the next cycle

AC-731 now has 17 attributed UATs across five files. It is still the largest AC in
the capability by a wide margin, and the assessor's suggestion that it be **split**
(band reconstruction / self-painting discrimination / bar detection / surface-rect
adoption / page-base inference) remains sound. Splitting is an `ac-add` on the
capability's shape rather than a coverage gap, so it was left out of scope for a
coverage-fix pass; the re-attribution above has already sorted the evidence into
the five clause groups a split would follow.
