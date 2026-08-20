---
uid: report-68170dfc
id: REPORT-2372
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=uat)'
created_by: xgd
created_at: '2026-08-20T04:54:53.380024+00:00'
updated_at: '2026-08-20T04:54:53.380024+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: uat
  violations: 17
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: uat

**Result**: FAIL
**Violations**: 17
**Warnings**: 1
**Needs review**: 0

First `uat` cycle of this run. The two upper levels passed immediately before
(`report-afa769c6` story PASS 04:23, `report-a181e8c1` ac PASS 04:47), so per the
level cascade the AC body is my working reference and intent was consulted only where
an AC looked suspicious.

The ac cycle handed forward an explicit agenda: eleven ACs authored in its attempt-7
fix loop carry `uat_coverage: pending`, and AC-638's test is narrower than its rewritten
criterion while its flag still reads `pass`. **I did not take that agenda on trust.** I
re-derived the AC→test mapping mechanically from the test tree and found the handoff
undercounted: **sixteen** active ACs have no AC-linked UAT, not eleven (STORY-116's five
were never in the handoff list). More importantly, the handoff's framing — "eleven ACs
with no test at all" — is wrong in a way that changes the repair. Thirteen of the sixteen
behaviours **are** substantively tested already, under the free-coded
`test_UAT_FC_<TICKET-ID>_*` convention; only three are genuinely unproven.

## Method — how the AC→test mapping was derived

Test discovery is keyed strictly on `^test_UAT_AC\d+_` (`xgd_source/quality/test_naming.py:24`;
scope selection builds `-k` patterns from AC numbers at `quality/scope.py:596-616`; the
regression collector matches `test_UAT_AC(\d+)_` at `core/regression_success/collector.py:40`).
The free-coded form `test_UAT_FC_<TICKET-ID>_*` is a **separate** index resolved by intent
UID (`quality/scope.py:390-417`, `quality/runner.py:1999-2016`). The two do not
interoperate: an FC-named test is invisible to every AC-keyed mechanism.

I enumerated every `test_UAT_AC<N>` identifier in the repo with `grep -a` (the `-a` matters —
`tools/generate/src/cli/fidelity.ts` contains NUL bytes and greps as binary, so a plain sweep
silently drops the `--collapse`/`--clusters` implementation) and set-differenced it against
the 63 active ACs across the six stories. I did **not** rely on the `uat_coverage` field —
see the warning; it is demonstrably stale.

## Cumulative Intent Considered

Consulted only where an AC was suspicious. The full chronological ledger is in this run's
story-level report `report-afa769c6` (PASS) and is not restated.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-114 (`request-3cd338cd`) | free_and_reconciled | 2026-07-31 | Retires the module-level palette-role alias; a module colour is a `#hex` literal | YES (retires) — checked because AC-638's test does not exercise the retirement |
| REQ-72 (`request-0698bbdf`) | free_and_reconciled | 2026-08-19 sweep | In-browser hexification of gradient stop colours | YES — carried by AC-1307; **no test of any convention** |
| REQ-62 (`bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-16 | Panel/surface gradient: capture + render + diff | YES — the *capture-side* walk (AC-1308) is untested; the diff side (AC-636) is covered |
| REQ-64 (`request-07d0e3e1`) / REQ-76 (`request-3a11304d`) | free_and_reconciled | 2026-08-19 sweep | Noise audit, `--collapse`, Type-A/B order; `--clusters` | YES — FC-tested in `tests/req63-values-diff-coverage.test.ts`, AC-unlinked |
| REQ-73 (`request-859652ae`) | free_and_reconciled | 2026-08-19 sweep | Adjacent-gap axis + retirement of band vertical padding | YES — FC-tested, AC-unlinked |
| BUG-15/16/22/24/25 (`bundle-4ff83a8b`) | free_and_reconciled | 2026-07-29 | Band fallback; font settling; surface-bearing box; scrim capture; run geometry | YES — each FC-tested in its own `bugNN-*.test.ts`, all AC-unlinked |
| REQ-58 (`bundle-ab9e0cb6`) | free_and_reconciled | — | Boolean flag set pinned + derived from CLI source | YES — FC-tested, AC-unlinked (AC-1290) |
| REQ-148 (`request-7ae3c2cc`) | ready_to_reconcile | 2026-08-15 | Behavior modules render in workerd | imminent — **still not reconciled**, re-checked; AC-739 stands and its test is live |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-75 (`story-d5de22a5`) — 21 ACs | bundle-ab9e0cb6, bundle-4ff83a8b, request-859652ae | **14/21 covered.** AC-629/630/631/632/633/711/712/713/714/715/815/816/817/818 carry AC-linked UATs. The 7 attempt-7 ACs (1310–1316) carry none — all seven behaviours are FC-tested |
| STORY-76 (`story-82eb6908`) — 7 active + 1 deprecated | bundle-ab9e0cb6, request-0698bbdf, request-3cd338cd | **4/7 covered, 1 of those defectively.** AC-634/635/636 sound; AC-638 covered but narrower than its criterion; AC-1307/1308 **wholly unproven**; AC-1309's behaviour is proven only by the test of the *deprecated* AC-637 |
| STORY-77 (`story-16f2793c`) — 8 ACs | bundle-ab9e0cb6 (REQ-61 size-aware half) | **aligned — 8/8 covered.** AC-639…645, 647 all carry AC-linked UATs in `tests/reconciliation-size-aware-diff.test.ts`; assertions read persisted ladder artifacts, not source text |
| STORY-78 (`story-2c7069fe`) — 9 ACs | bundle-ab9e0cb6 (REQ-61 cross-size half) | **aligned — 9/9 covered.** AC-648…655, 721 in `tests/reconciliation-responsive-diff.test.ts`; substantive (drives the verb, parses stdout and the `--out` file) |
| STORY-79 (`story-e15a19ef`) — 13 ACs | bundle-ab9e0cb6, bundle-15c1f647 | **12/13 covered.** AC-656/657/658/659/720/738/739/1013…1017 carry AC-linked UATs. AC-1290 carries none; its behaviour is FC-tested at `tests/req58-multi-viewport.test.ts:171` |
| STORY-116 (`story-aaddb221`) — 5 ACs | request-07d0e3e1, request-3a11304d | **0/5 covered.** Not in the ac cycle's handoff list. Four of five are FC-tested in `tests/req63-values-diff-coverage.test.ts`; AC-1285 is not |
| AC-637 (`acceptance_criterion-377af866`) | REQ-62, superseded by REQ-84/REQ-96 | Deprecated, but `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` is still live and is the *only* proof of AC-1309's resolver behaviour — see finding 4 |

## Findings

### Group A — behaviour implemented but unproven by any test, of any convention (most severe)

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1307 `acceptance_criterion-4ecfd679` (STORY-76) | uat-add | REQ-72's in-browser stop hexification. `hexifyGradient` is implemented at `tools/generate/src/cli/capture/extract.ts:334` and called from both capture sites (`:846` surface, `:1132` text-fill), but a repo-wide `grep -a` for `hexifyGradient` returns **only those three production lines — zero test references**. This is the AC whose own body names the failure mode as the animating invariant *inverted*: unhexified stops make the regex match nothing, the gradient captures as `135° []`, and an empty stop list reads as a clean match against any reproduction. Nothing currently prevents that regressing. (REQ-52's oklch tests at `tests/req52-oklch-colour.test.ts` cover *run* colour resolution, a different code path — they do not touch gradient declarations) | Author `test_UAT_AC1307_*`: capture a fixture whose text-fill and panel gradients use `oklch()`/`color-mix()` stops; assert both capture with populated `#rrggbb` stop lists in painted order, that positions/direction survive untouched, and that an already-`#hex` gradient passes through unchanged |
| 2 | violation | coverage | AC-1308 `acceptance_criterion-bf0cbabb` (STORY-76) | uat-add | The surface-gradient ancestor walk. `surfaceGradientOf` is implemented at `extract.ts:840-846` (nearest-wins; skip `background-clip:text`; stop at first opaque solid) and consumed at `:1174` → `sections.ts:115` / `values-diff.ts:872`. `grep -a` for `surfaceGradientOf` returns **only production lines — zero test references**. The AC body itself flags this as "the one place capture can be silently wrong in a way the diff cannot detect: pick the wrong ancestor and both sides agree on a value that is not what paints." `tests/req62-gradient-panel.test.ts` covers the *diff* axis (AC-636) over hand-built manifests, so it cannot catch a wrong-ancestor capture | Author `test_UAT_AC1308_*` exercising the walk directly: nested gradient ancestors (assert nearest wins); a `background-clip:text` ancestor (assert skipped, not recorded as surface); an opaque solid between run and gradient (assert none recorded); no gradient ancestor (assert none, not empty) |
| 3 | violation | coverage | AC-1285 `acceptance_criterion-dec81393` (STORY-116) | uat-add | The noise layer's reversibility property. The AC requires two things hold: the raw axis stays exact (same bundle re-reported with treatment off still yields the delta, so the decision is reversible without re-capture) and every suppression names a declared per-axis rule. Adjacent evidence exists — `tests/req35-values-diff-noise.test.ts` pins individual tolerance rules (perceptual colour distance, inferred-colour confidence) and AC-630's test covers `--tolerant` loosening — but **no test asserts the reversibility property itself**, which is the whole claim distinguishing "a layer over an exact capture" from "a looser capture". This is the AC most at risk of being marked covered by proximity | Author `test_UAT_AC1285_*` per its Verification section: one fixture bundle differing by a sub-visual amount inside a tolerance and a visible amount outside it; assert only the visible one reports; re-report the **same** bundle with the dial widened and assert the previously-reported delta is now absorbed — proving report-time suppression over an unchanged capture |

### Group B — criterion covered, but the test is narrower than the criterion

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 4 | violation | consistency | AC-638 `acceptance_criterion-a657c39c` (STORY-76) | uat-edit | **Independently re-verified, not carried forward.** AC-638's Verification section demands four validations; `test_UAT_AC638_gradient_field_accepts_wellformed_rejects_malformed` (`tests/reconcile-gradient-first-class.test.ts:138-154`) performs two — a well-formed hex gradient accepted (`:143-146`), a non-object rejected (`:150-153`). It asserts **neither** the palette-role-stop rejection (the entire point of the REQ-114 repair that inverted this criterion last cycle) **nor** the bad-direction rejection. I checked the code rather than assuming: both rejections genuinely work — `validateColor` is hex-only via `isColorLiteral` (`packages/framework/src/modules/validate.ts:101-107`), reached per stop at `:130-134`, and `angleDeg` is validated at `:116-125`. So this is `uat-edit`, **not** `code-issue`: the criterion and the code agree and only the evidence lags | Extend the UAT with the two missing assertions: a stop colour given as a palette-role name (e.g. `accent`) yields an error naming `panelGradient.stops[i].color`; a direction that is neither a number nor a listed alias yields an error naming `panelGradient.angleDeg`. Then reset `uat_coverage` from its stale `pass` |
| 5 | violation | coverage | AC-1309 `acceptance_criterion-625718e8` (STORY-76) | uat-edit | AC-1309 carries the `resolveSurfaceGradient` behaviour that the ac cycle moved off the now-deprecated AC-637. The behaviour **is** tested — `resolveSurfaceGradient` is exercised at `tests/req62-gradient-panel.test.ts:81,87` and `tests/reconciliation-l1-one-colour-system.test.ts:180-182` — but the test still carries the *deprecated* AC's number: `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` (`req62-gradient-panel.test.ts:69`). AC-1309 is therefore uncovered while a deprecated AC is the sole owner of live evidence | Rename `test_UAT_AC637_…` → `test_UAT_AC1309_…`, and extend it with AC-1309's "no fill when undefined" clause. This closes finding 5 and retires the orphaned deprecated-AC test in one edit |

### Group C — behaviour substantively FC-tested, but no AC-linked UAT (single systemic cause)

All twelve share one cause and one repair shape: the ac cycle's attempt-7 fix loop authored
ACs describing behaviour that free-coded intents had already implemented **and tested**, but
no test was ported to the AC-keyed convention. The behaviour is not at risk; the *matrix
linkage* is absent, so `xgd` cannot select, trace, or report evidence for these ACs, and a
regression in any of them would be attributed to no AC.

| # | Severity | Property | Element | Resolution category | Existing FC evidence | Suggested edit |
|---|---|---|---|---|---|---|
| 6 | violation | coverage | AC-1310 `acceptance_criterion-c1d7d6d6` | uat-edit | `test_UAT_FC_BUG-25_multiline_runs_get_distinct_geometry`, `_no_two_runs_share_a_rendered_text_box`, `_single_run_element_keeps_element_geometry`, `_line_count_is_measured_per_run`, `_distinct_run_boxes_stack_and_pin_in_the_fold` (`tests/bug25-multiline-run-geometry.test.ts:102-182`) | Port to `test_UAT_AC1310_*`. **Caveat**: four of the five are `itB` = `it.runIf(browserOk)` (`:98`) — see warning 1 |
| 7 | violation | coverage | AC-1311 `acceptance_criterion-1e7d867f` | uat-edit | Six tests, `tests/bug22-split-control-surface.test.ts:109-171` (records which box paints; no phantom shape delta; surface geometry defect reported; genuinely-square box still reports; self-painting both sides; band runs gain no noise) — all plain `it`, browser-independent | Port to `test_UAT_AC1311_*` |
| 8 | violation | coverage | AC-1312 `acceptance_criterion-acaea443` | uat-edit | `test_UAT_FC_REQ-73_gap_axis_measures_relative_spacing_and_reports_the_correction`, `_matching_gap_and_side_by_side_row_emit_no_gap_delta` (`tests/req63-values-diff-coverage.test.ts:412,425`) | Port to `test_UAT_AC1312_*` |
| 9 | violation | coverage | AC-1313 `acceptance_criterion-78655f6e` | uat-edit | `test_UAT_FC_REQ-73_section_band_padding_no_longer_compared` (`:440`) for the retirement half; `test_UAT_FC_REQ-64_padding_sides_top_right_bottom_delta` (`:255`) and `_text_align_delta` (`:275`) for the retained half | Port all three to `test_UAT_AC1313_*` — the AC asserts both halves (retired *and* retained), so it needs both |
| 10 | violation | coverage | AC-1314 `acceptance_criterion-629184ba` | uat-edit | Five tests, `tests/bug16-webfont-load-before-extract.test.ts:94-170` (mirrored crossorigin webfont; mirrored absolute URL rewrite; live capture not fallback; extract script stays synchronous; full stack reaches rendered CSS) | Port to `test_UAT_AC1314_*`. **Caveat**: three of five are `itB` — see warning 1 |
| 11 | violation | coverage | AC-1315 `acceptance_criterion-ea1a2972` | uat-edit | `test_UAT_FC_BUG-15_extract_populates_content_from_collapsed_flat_tree`, `_scoreboard_moves_when_render_changes`, `_semantic_multiband_dom_bypasses_fallback` (`tests/bug15-values-diff-l1-flat-dom.test.ts:81-116`) — the third is the important negative case | Port to `test_UAT_AC1315_*` |
| 12 | violation | coverage | AC-1316 `acceptance_criterion-b5cd02d4` | uat-edit | `test_UAT_FC_BUG-24_capture_records_a_color_mix_scrim_with_its_alpha`, `_capture_does_not_invent_a_scrim_on_a_plain_band` (`tests/bug24-scrim-alpha.test.ts:185,202`), plus four fold-side tests at `:82-145` | Port the two capture-side tests to `test_UAT_AC1316_*` (the AC is about capture). **Caveat**: both are `itB` |
| 13 | violation | coverage | AC-1290 `acceptance_criterion-cf26bae1` (STORY-79) | uat-edit | `test_UAT_FC_REQ-58_boolean_flag_set_is_derived_from_the_cli_source` (`tests/req58-multi-viewport.test.ts:171-180`) matches the AC's wording exactly — it derives the boolean reads from the CLI source and asserts set-equality against `BOOLEAN_FLAGS`. Also `_boolean_flag_set_is_pinned_entire` (`:147`) and the parameterised `_boolean_flag_never_swallows_the_slug` over every flag (`:183`) | Port to `test_UAT_AC1290_*`. Note this AC is legitimately source-derived by design — the capability body requires the gated set be "asserted entire" — so the usual "no AST checks" rule does not disqualify it |
| 14 | violation | coverage | AC-1286 `acceptance_criterion-0c4c0e8b` (STORY-116) | uat-edit | `test_UAT_FC_REQ-64_collapse_dedups_ladder_to_one_row_per_defect` (`tests/req63-values-diff-coverage.test.ts:289`) | Port to `test_UAT_AC1286_*`; extend with the AC's `--collapse --json` document shape and the "states the raw total it collapsed from" clause |
| 15 | violation | coverage | AC-1287 `acceptance_criterion-62c1609f` (STORY-116) | uat-edit | `test_UAT_FC_REQ-64_position_is_derived_and_excluded_from_the_headline_count` (`:329`), plus `_text_run_box_size_is_not_a_defect_glyph_extent_is` (`:361`) | Port to `test_UAT_AC1287_*` |
| 16 | violation | coverage | AC-1288 `acceptance_criterion-88661be9` (STORY-116) | uat-edit | `test_UAT_FC_REQ-64_deltas_tagged_A_or_B_repair_class` (`:452`) and `_collapse_marks_fluid_value_structural` (`:306`) — together they cover Type-A flat / Type-A structural / Type-B | Port both to `test_UAT_AC1288_*`; add the AC's "report presents them in repair order" assertion |
| 17 | violation | coverage | AC-1289 `acceptance_criterion-3dfc51df` (STORY-116) | uat-edit | `test_UAT_FC_REQ-76_defects_roll_up_into_causes_with_dispositions` (`:385`) exercises `clusterDefects` | Port to `test_UAT_AC1289_*`; extend with the AC's no-phantom-merge-across-widths clause and the `--clusters` wins over `--collapse` precedence (implemented at `tools/generate/src/cli/index.ts:794-802`) |

### Warnings and observations

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| W1 | warning | coverage | AC-1310, AC-1314, AC-1316 | uat-edit | The FC evidence for these three is predominantly browser-gated: `const itB = it.runIf(browserOk)` (e.g. `tests/bug25-multiline-run-geometry.test.ts:98`). Where no browser is present these skip silently, so a naive port would produce an AC that reports covered while contributing no assertions in a headless run. AC-1311 and AC-1315 have plain-`it` coverage and are unaffected | When porting, either keep at least one non-browser assertion per AC (BUG-25 and BUG-16 each already have one plain `it` that can carry the AC number), or accept the gating explicitly and record it on the AC so a later cycle does not mistake a skip for a pass |
| I1 | info | — | `uat_coverage` field across this capability | — | The field is not a reliable filter and this cycle did not use it. AC-638 reads `pass` while its test provably omits half its criterion (finding 4); AC-1285 carries **no `uat_coverage` key at all** while its five STORY-116 siblings read `pending`; the 15 other gap ACs read `pending`. The ac report predicted exactly the AC-638 trap — "a uat cycle that filters on `uat_coverage != pass` will not look at AC-638 at all" — and it would also have missed AC-1285 | none at this level; the mapping was derived from the test tree instead |
| I2 | info | — | STORY-77, STORY-78 | — | Both are fully covered and substantive. I checked for the structural/AST anti-pattern specifically: their assertions read persisted artifacts and command output (`reconciliation-size-aware-diff.test.ts:350-354` reads `multistate.json` and the ladder screenshot bytes; `reconciliation-responsive-diff.test.ts:381-407` drives the verb and parses stdout plus the `--out` file), not production source text | none |
| I3 | info | — | AC-739 `acceptance_criterion-fcf814b5` | — | Re-checked this cycle: REQ-148 (`request-7ae3c2cc`) is **still `ready_to_reconcile`** (2026-08-15), so its retirement of the Astro-container clause remains imminent, not actual. AC-739 stands and its test is live. Carried forward so the next cycle recognises the pending retirement rather than re-deriving it | none — revisit when REQ-148 reconciles |
| I4 | info | — | Exclusivity across all 63 ACs | — | No exclusivity violations found. The nearest candidates are deliberate and declared: AC-656 vs AC-1290 (AC-656 opens with a scope note naming itself the REQ-58 regression anchor and AC-1290 the general surface), and `tests/reconcile-values-diff-fidelity.test.ts:13,83` which explicitly documents its division of labour with the real-Chromium sibling `test_UAT_FC_REQ-58_surface_fill_composites_translucent_over_band`. Differing test shapes over one AC are acceptable per this check's own rule | none |

## Notes for the Editor

**The repair is thirteen renames, three new tests, and one extension — not sixteen new
tests.** That distinction is the main thing this cycle establishes. Group C is a
mechanical porting job over tests that already exist and already pass; Group A is the only
place where new test *design* is required, and it is confined to three ACs. Sizing the work
as "sixteen ACs with no tests" would badly overstate it and invite re-deriving evidence that
is already written.

**Group A is where the actual risk sits, and both of its gradient findings are capture-side.**
AC-1307 and AC-1308 are the two ACs in this capability whose own bodies identify them as
silent-failure modes — an empty stop list reading as a clean match, and a wrong-ancestor
capture both sides agree on. Both are exactly the "gate reported clean while the render
visibly differed" blind spot the capability body names as its animating concern, and both are
currently defended by nothing. If the fix loop can only do part of this, do findings 1 and 2
first.

**Why the FC→AC port is the right resolution and not a naming quibble.** The two conventions
index different things and do not interoperate — `test_UAT_FC_*` resolves by intent UID for
free-coded work (`quality/scope.py:390-417`), `test_UAT_AC<N>_*` resolves by AC number for the
matrix (`quality/test_naming.py:24`, `quality/scope.py:596-616`). These intents are all
`free_and_reconciled`, so the FC index has discharged its purpose; the matrix form is now the
canonical one. Porting is the normal terminal step of reconciliation, and it is what the
attempt-7 AC authoring left undone.

**One cross-cutting cause explains sixteen of the seventeen findings.** The ac cycle correctly
diagnosed its predecessor as a *one-sided repair* — story bodies edited without discharging the
AC obligation — and then reproduced the same shape one level down: it authored ACs without
discharging the UAT obligation those ACs created. The pattern is now two-for-two, so it is
worth stating plainly: an element authored at level N creates an obligation at level N+1, and
the cycle that authors it should record that obligation rather than leaving the next level to
rediscover it. The ac cycle did record it, partially and in prose (its info 3) — but it
undercounted by five because it enumerated only the ACs *it* had authored and never re-derived
STORY-116's, which had been created earlier in the same run.

**What I did not re-verify.** STORY-77 and STORY-78 were spot-checked for the structural-check
anti-pattern (I2) but their 17 ACs were not read clause-by-clause against their tests; both
passed ac review this run and neither has pending ACs. The 12 covered ACs on STORY-79 and the
14 on STORY-75 were confirmed to have AC-linked tests and were not audited for narrowness. If
the AC-638 defect — a test quietly narrower than a criterion that was later rewritten — turns
out to be a pattern rather than a one-off, that unaudited surface is where the next instance
would be, and the trigger to look is any AC whose criterion was edited after its test was
written.
