---
uid: report-3198a7b5
id: REPORT-2375
type: report
title: Fix 1c Capture & Diff Fidelity (uat) — attempt 7
created_by: xgd
created_at: '2026-08-20T05:05:50.582655+00:00'
updated_at: '2026-08-20T05:05:50.582655+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: uat
  fixes_applied: 14
  progress_made: true
  needs_more_work: true
  violations_remaining: 10
  anchor_report_uid: report-2485c83c
---

# Fix Summary — 1c Capture & Diff Fidelity (uat)

**Attempt**: 7
**Fixes applied this call**: 14
**Violations remaining**: 10
**Needs more work**: true

Took the report's own priority ordering: **Group A first** (the two capture-side
gradient blind spots the capability body names as its animating concern, plus the
noise-reversibility property), then **Group B** (the two narrow/mis-numbered tests),
then the two Group C ports whose FC evidence is browser-*independent* — so nothing
landed this call that reports covered while contributing zero assertions headlessly.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1307 (finding 1) | New `tests/req72-gradient-capture.test.ts` — 3 headless UATs (`test_UAT_AC1307_non_hex_stops_capture_as_hex_in_painted_order`, `_direction_and_stop_positions_are_left_untouched`, `_already_hex_stops_and_non_gradients_pass_through_unchanged`) driving the real `EXTRACT_SCRIPT` under jsdom, plus browser-gated `test_UAT_AC1307_oklch_and_color_mix_stops_capture_as_hex` over a new fixture. All 3 headless pass |
| 2 | uat-add | AC-1307 fixture | New `tests/fixtures/capture/gradient-oklch.html` — panel sweep in `oklch()`, wordmark text-fill in `oklch()` + `color-mix()` |
| 3 | ac-edit | AC-1307 | Corrected the final criterion bullet (see "Unsupported clause" below) and recorded the browser gating per warning W1 |
| 4 | uat-add | AC-1308 (finding 2) | 4 headless UATs in the same file — `test_UAT_AC1308_nearest_gradient_ancestor_wins`, `_text_fill_ancestor_is_skipped_not_recorded_as_a_surface`, `_walk_stops_at_the_first_opaque_solid`, `_no_gradient_ancestor_records_none`. One per rule in the criterion; all pass |
| 5 | uat-add | AC-1285 (finding 3) | 2 UATs in `tests/req35-values-diff-noise.test.ts` — `test_UAT_AC1285_noise_layer_suppresses_at_report_time_and_is_reversible` (same stored bundle re-reported with the axis dial widened, then turned back; both sides' captured extents re-read off disk and asserted unchanged) and `_a_difference_outside_every_rule_survives_the_treatment`. Both pass |
| 6 | uat-edit | AC-638 (finding 4) | Extended `test_UAT_AC638_…` with the two assertions its Verification demanded and the test omitted: a palette-role stop errors on `panelGradient.stops[1].color`; a non-alias direction errors on `panelGradient.angleDeg`. Confirms the assessor's read — the code already rejects both, only the evidence lagged. Passes |
| 7 | uat-edit | AC-1309 (finding 5) | Retired the orphaned deprecated-AC test: `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` → `test_UAT_AC1309_surface_gradient_resolves_direction_and_stops`, split into 3 and extended to the full criterion (alias→keyword direction, verbatim vs evenly-distributed positions, no `background-clip`/`color:`, `<2` stops → `''`, non-literal stop drops the whole gradient). Passes. AC-637 was already `status=deprecated`/`uat_coverage=deprecated` — no further action needed |
| 8 | uat-edit | AC-1311 (finding 7) | Ported all 6 `test_UAT_FC_BUG-22_*` → `test_UAT_AC1311_*`. All plain `it`, browser-independent; pass |
| 9 | uat-edit | AC-1315 (finding 11) | Ported all 3 `test_UAT_FC_BUG-15_*` → `test_UAT_AC1315_*`. Pass |
| 10–14 | field update | AC-1307, AC-1308, AC-1309, AC-638, AC-1285, AC-1311, AC-1315 | `uat_coverage: pass` set on each (AC-638's stale `pass` is now earned rather than asserted) |

Verification run over every touched file: **34 passed, 4 skipped** (the 4 skips are
browser-gated — 3 pre-existing, 1 new; see "Environment" below). `tests/naming.test.ts`
also re-run clean after the renames; no stale references to the renamed identifiers
remain outside the assessor's own report.

## Unsupported clause corrected on AC-1307 (the one deviation from the finding's category)

Finding 1 is `uat-add`, and I wrote the UATs. But one bullet of AC-1307 could not be
tested because **the behaviour it asserts does not exist and no intent asks for it**:

> "A bundle captured before this resolution existed — whose stops captured empty —
> raises no delta rather than a false one."

Evidence chain: `gradientsMatch` (`tools/generate/src/cli/capture/values-diff.ts:1657-1658`)
returns false on any stop-count mismatch, and there is no empty-stop guard anywhere in
`values-diff.ts` or `fidelity.ts` (`grep -a` for `stops.length` returns only those two
lines). So a stale empty-stop reference against a real reproduction **does** raise a
delta. That is not a bug — it is the exact symptom REQ-72 (`request-0698bbdf`) was raised
to fix: *"the gigabytealchemy card gradient captured as `135° []` … 3 REQ-64 Type-A deltas
that read as a capture gap"* — and REQ-72's stated remedy is *"Re-capture gigabyte; the
stops then populate."* The bullet inverted its own intent.

Rather than author a test for absent behaviour, or make a code change no intent backs, I
replaced that bullet with the intent-faithful statement (a stale bundle is repaired by
re-capture; until then its gradient axis is the Type-A capture gap REQ-72 closes). Every
other bullet is unchanged and is now covered. Flagging it here because it is an `ac-edit`
inside a `uat-add` finding, and because it is the second instance of the pattern the
assessor named: an element authored at level N creating an unverified obligation at N+1.

## Environment note — no Chromium in this runner

`chromiumAvailable()` is false here, so every `it.runIf(browserOk)` case skips. This
constrained the design rather than the coverage: AC-1308's four rules and AC-1307's
non-oklch half run **headlessly** over the real `EXTRACT_SCRIPT` via the BUG-15 jsdom
harness (jsdom resolves `background-image`, `background-color` and `background-clip`, and
`hexifyGradient`'s probe path resolves `rgb()` tokens — verified empirically before
writing). Only the oklch/`color-mix()` case genuinely needs a real engine, because jsdom's
`getComputedStyle` returns a modern-colour-space token verbatim.

**Therefore**: `test_UAT_AC1307_oklch_and_color_mix_stops_capture_as_hex` and its fixture
`gradient-oklch.html` were **authored but not executed** in this environment. They follow
the shape of the passing `test_UAT_FC_REQ-62_capture_records_panel_gradient_and_solid`
sibling in `req62-gradient-panel.test.ts` and share its fixture-server helper, but a
runner with Chromium provisioned should confirm them. Reported as unverified rather than
claimed as passing.

## Code Edits (if any)

None this call. Findings 1, 2 and 4 were each checked against the implementation first;
in every case the code and the criterion agreed and only the evidence was missing —
`hexifyGradient` (`capture/extract.ts:334`), `surfaceGradientOf` (`:840`), and the hex-only
`validateColor` (`packages/framework/src/modules/validate.ts:101-107`) all behave as their
ACs describe.

## Remaining Violations (10) — all Group C ports, plan for next call

| Finding | AC | FC evidence to port | Note |
|---|---|---|---|
| 6 | AC-1310 | `tests/bug25-multiline-run-geometry.test.ts` | W1: 4 of 5 are `itB`; keep the plain `it` on the AC number |
| 8 | AC-1312 | `tests/req63-values-diff-coverage.test.ts:412,425` | |
| 9 | AC-1313 | same file `:440`, `:255`, `:275` | AC asserts both halves — needs all three |
| 10 | AC-1314 | `tests/bug16-webfont-load-before-extract.test.ts` | W1: 3 of 5 are `itB` |
| 12 | AC-1316 | `tests/bug24-scrim-alpha.test.ts:185,202` | W1: both are `itB` |
| 13 | AC-1290 | `tests/req58-multi-viewport.test.ts:171` | |
| 14 | AC-1286 | `req63-values-diff-coverage.test.ts:289` | + `--collapse --json` shape and raw-total clause |
| 15 | AC-1287 | same file `:329`, `:361` | |
| 16 | AC-1288 | same file `:452`, `:306` | + repair-order presentation assertion |
| 17 | AC-1289 | same file `:385` | + no-phantom-merge-across-widths and `--clusters` > `--collapse` precedence |

For the three W1-flagged ACs (1310, 1314, 1316) the plan is the assessor's first option:
carry the AC number on at least one browser-independent case per AC so none of them
reports covered while contributing nothing in a headless run, and record the gating on the
AC where the remainder stays browser-only — the same treatment applied to AC-1307 here.

## needs_review Items Forwarded

None. No finding in this report was categorised `needs_review`, and none of the ten
remaining requires an operator decision.
