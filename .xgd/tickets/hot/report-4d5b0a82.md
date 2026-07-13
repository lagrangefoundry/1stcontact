---
uid: report-4d5b0a82
id: REPORT-532
type: report
title: 'Reconciliation Review: commits (BUNDLE-5, REQ-51..REQ-57)'
created_by: xgd
created_at: '2026-07-13T21:30:55.842458+00:00'
updated_at: '2026-07-13T21:30:55.842458+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-d9c2e655
  anchor_uid: bundle-d9c2e655
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (none — commits bundle)
**Anchor**: bundle-d9c2e655
**Stories Reviewed**: 8 (STORY-67..STORY-74)

## Method

Read the bundle intent (REQ-51..REQ-57 bodies + locked scope/phase decisions),
then independently confirmed the implemented behavior via the 8 reconciliation
UAT suites exercising the real code paths, then read all 8 story bodies. All 54
active ACs (AC-575..AC-628) were run: `54 passed (54)`, zero skipped (the
Chromium-gated colour UATs AC-589/590 executed against a real browser).

## Behavior Inventory (8 capability areas)

1. Object-grouped fidelity report — one card per reference object, box first-class, loud unpaired (REQ-51)
2. Exact-match-by-default tolerances — Group A/B/C, --tolerant opt-out, per-axis overrides (REQ-53)
3. Capture/diff blind-spot fixes — oklch/lab/lch/color() -> sRGB via canvas; one-sided-geometry STALE-REFERENCE flag (REQ-52)
4. Free-position named hero/header objects — reused positionVars band model, absolute hero__stack, pointer-transparent overlay (REQ-52)
5. Prose full-width default + live contentWidth cap on panel-none blocks (REQ-52)
6. Tailwind-aligned contentWidth/rowWidth scale + literal escape hatch via inline custom property (REQ-55)
7. Component-owned typography subscales end-to-end — tokens, services-grid consumer, per-instance hook, capture, values-diff attribution/rollup/opt-out (REQ-56)
8. Styled-text block-document model + lossless notation, all block kinds, round-trip invariant (REQ-54 + REQ-57)

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Object-grouped report (REQ-51) | Covered | story-74050e88 | AC-575..581; drives real diffManifests/formatReport |
| 2 | Exact-match tolerances (REQ-53) | Covered | story-dadb8475 | AC-582..588; real diffManifests + CLI run() |
| 3 | Modern-CSS colour + stale-geometry (REQ-52) | Covered | story-79e068e5 | AC-589..593; canvas resolution vs jsdom fallback both proven |
| 4 | Hero/header free positioning (REQ-52) | Covered | story-d70a0264 | AC-594..600; Astro SSR render, --fc-* asserted |
| 5 | Prose full-width default (REQ-52) | Covered | story-8a42499e | AC-601..603; runtime marker + scoped-CSS measure |
| 6 | contentWidth Tailwind scale (REQ-55) | Covered | story-d555b990 | AC-604..609; named/literal/bleed + retired-name removal |
| 7 | Typography subscales (REQ-56) | Covered | story-bb049a62 | AC-610..617; buildTheme + diffManifests, all 5 phases |
| 8 | Styled-text block model + notation (REQ-54+57) | Covered | story-8b5ebbf7 | AC-618..628; pure parse/serialize/normalize round-trip |

No uncovered or partially-covered behaviors within the declared scope of the bundle.

## Ungrounded Stories

None. Every story describes behavior present in the code and proven by a passing UAT through a real interface.

## Intent-vs-Code Divergences (all flagged, none absorbed)

| Intent claim | Code reality | Handling |
|--------------|-------------|----------|
| REQ-51 item 4: expected column uses "same vocabulary as the spec" (full paste-able styled-run) | Surfaces spec field names/units only; full spec round-trip is a sibling ticket | STORY-67 body flags it explicitly as a divergence; ACs assert only delivered behavior |
| REQ-54 declared 5 workstreams (model+notation, schema, render, capture, diff) | Only workstreams 1 & 2 (the pure text-markup unit) implemented; wired into no render/schema/capture/diff path | STORY-74 body carries an explicit "Intent-vs-code divergence (flagged, not absorbed)" note; consistent with the operator's locked REQ-54 model-pivot scope and REQ-57 scope decision; downstream WS deferred to future stories |
| REQ-56 names a button-label subscale slot | Not implemented in this bundle (badge/checklist only) | STORY-73 out-of-scope note flags it as an intent-named future slot |

These are the correct reconciliation outcome: the matrix documents what the code does and the story bodies note where that stops short of the intent, rather than silently presenting partial work as complete.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. fidelity / values-diff report | story-74050e88 (STORY-67) | OK |
| 2. fidelity / values-diff tolerances | story-dadb8475 (STORY-68) | OK |
| 3. capture extract + values-diff | story-79e068e5 (STORY-69) | OK |
| 4. framework hero/header positioning | story-d70a0264 (STORY-70) | OK |
| 5. framework text-block prose width | story-8a42499e (STORY-71) | OK |
| 6. framework content-width dials | story-d555b990 (STORY-72) | OK |
| 7. framework typography subscales | story-bb049a62 (STORY-73) | OK |
| 8. framework text-markup notation | story-8b5ebbf7 (STORY-74) | OK |

All 8 plan items produced a story (all feature stories — matrix was empty, no upgrade targets existed). None dropped.

## Evidence Sufficiency (Step 5b)

- All 54 active ACs (AC-575..AC-628) have a covering `test_UAT_AC{n}_*` UAT; the full set runs `54 passed (54)` with zero skips.
- Real entry points, no internal mocking: fidelity UATs drive `diffManifests`/`formatReport` and the CLI `run()` surface; hero/prose/services-grid render through the Astro SSR container (`renderToString`) that tools/generate uses; colour UATs capture a real oklch fixture page through Chromium (`cmdCapturePage`) and separately prove the jsdom rgb() fallback; the styled-text UATs exercise the pure `parseStyledText`/`serializeStyledText`/`normalizeStyledText` public API (500+-seed round-trip property test).
- Assertions are discriminating, not source-inspection bookkeeping: e.g. AC-595 asserts NO positioning apparatus is emitted for an unpositioned hero (fails if the code always emitted it); AC-589 asserts a real colour delta now surfaces through diffManifests (fails if the sentinel/inferred-suppression path persisted); AC-616 asserts the opt-out restores rolled-up rows.
- Minor, acceptable: the prose UATs (AC-601..603) supplement the runtime `has-content-width` / `--fc-content-width` marker assertions with a scoped-CSS read of the module's `max-width` rule. The discriminating behavior (dial applied -> marker + custom property; absent -> not) is observed at runtime; the CSS read only pins a px measure jsdom cannot compute. This is not a source-inspection-only test and does not weaken the evidence.

## Judgment Calls

- REQ-54/REQ-57 partial implementation (model+notation only) is NOT a failure: it is documented behavior with an explicit, operator-locked scope decision, and STORY-74 flags the divergence rather than absorbing it. A developer reading the story would correctly understand the module is a standalone notation unit not yet wired downstream.
- Site-data authoring edits (gigabytealchemy/1stcontact/ADA/etc.) are free-coding-exempt and correctly excluded from the story set; not a coverage gap.

## Verdict

PASS: The eight stories faithfully represent the operator's stated intent across REQ-51..REQ-57. Every plan item produced a story; all in-scope code behaviors are covered; the three points where the code stops short of the intent are explicitly flagged in the story bodies rather than silently absorbed; no story invents behavior; and all 54 active ACs are backed by passing UATs that enter through real interfaces and would fail if the asserted behavior were removed. A developer reading only these stories would have an accurate picture of what the operator intended to build and what was actually delivered in this bundle.
