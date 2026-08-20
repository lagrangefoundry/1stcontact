---
uid: report-5a2d2db9
id: REPORT-2382
type: report
title: Fix 1c Capture & Diff Fidelity (uat) — attempt 7 (call 3, complete)
created_by: xgd
created_at: '2026-08-20T05:47:51.402370+00:00'
updated_at: '2026-08-20T05:47:51.402370+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: uat
  fixes_applied: 26
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — 1c Capture & Diff Fidelity (uat)

**Attempt**: 7 (third call)
**Fixes applied this call**: 26
**Violations remaining**: 0
**Needs more work**: false

All seventeen findings from `report-68170dfc` are now resolved. This call took the
three warning W1 flagged as browser-gated — the ones the previous two calls
deliberately left until last because they needed test *design*, not porting.

## The W1 problem, and what I did about it

W1 warned that a naive port of these three would produce ACs reporting covered
while contributing no assertions on a headless runner. That risk was real and, in
one case, **already realised**: `bug24-scrim-alpha.test.ts` defined its own
`itB` as a wrapper that returned early when `capture` was undefined —

```ts
const itB = (name, fn) => it(name, () => { if (!capture) return; fn() })
```

so on a runner with no Chromium those two tests reported **PASS**, not skip. A
genuinely broken scrim probe would have read green here. Replaced with
`it.runIf(browserOk)`, which skips honestly. That is the single most valuable
change in this call and it was not in the findings list.

For all three ACs I took W1's *first* option — at least one browser-independent
assertion per AC — rather than accepting the gating. Each needed a different route
to it:

| AC | How the criterion becomes headless-provable |
|---|---|
| AC-1310 | The two-branch rule (`extract.ts:1122-1124`) is a *decision*, not a measurement. jsdom has no layout, so the harness supplies it — element rects by class **and** `Range` rects by covered text, which is how the browser distinguishes one text node's line from its sibling's. Only the layout numbers are stubbed; the branch under test is shipped code |
| AC-1314 | Mechanism (c)'s claim is about the *question the probe asks*. Supplying the `document.fonts` FontFaceSet (jsdom has none) and recording the query proves it directly: the shorthand carries `italic`, the real `700` and `56px` — never a bare 400 — and is passed the run's own text |
| AC-1316 | Only the modern colour *syntaxes* need an engine. What the probe does once a colour resolves — preserve partial alpha, refuse opaque, refuse fully transparent, refuse unparseable, refuse a veil that doesn't blanket the band — is engine-independent and runs over the real `EXTRACT_SCRIPT` |

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1316 (finding 12) | Ported both capture-side tests → `test_UAT_AC1316_*`; **replaced the vacuous-pass `itB` wrapper with `it.runIf`** |
| 2 | uat-add | AC-1316 | Three headless UATs over `EXTRACT_SCRIPT`: `_a_translucent_veil_is_recorded_with_its_alpha_preserved` (alpha 0.3 and `#020618` both survive), `_opaque_transparent_and_invalid_fills_are_not_scrims` (three refusals in one), `_a_veil_that_does_not_blanket_the_band_is_not_its_overlay` (the ≥60% cover rule — the false-positive direction) |
| 3 | uat-edit | AC-1310 (finding 6) | Ported all five tests → `test_UAT_AC1310_*` |
| 4 | uat-add | AC-1310 | Four headless UATs: `_a_split_element_yields_one_run_per_text_node_each_with_its_own_box` (boxes differ by exactly one line-height, neither is the shared element box), `_a_single_run_element_is_still_measured_off_the_element` (the no-regression branch), `_two_runs_whose_elements_share_a_rect_still_record_identical_boxes` (the rule is "its own rect", not "always differ"), `_each_split_run_derives_a_line_count_of_one_from_its_own_box` |
| 5 | uat-edit | AC-1314 (finding 10) | Ported all five tests → `test_UAT_AC1314_*` |
| 6 | uat-add | AC-1314 | `_font_probe_asks_for_the_real_weight_style_and_the_runs_own_text` — asserts the full shorthand, that no bare `400` appears, that the run's own text is passed, that a generic keyword is never probed at all, and that an unloaded face is reported `fontLoaded: false` rather than assumed true |
| 7 | ac-edit | AC-1316, AC-1314 | Appended an **Evidence gating** note to each, naming exactly which clauses stay browser-only and which run headlessly — so a later cycle does not mistake a skip for a pass, or re-derive the split |
| 8–26 | field update | AC-1310, AC-1314, AC-1316 | `uat_coverage: pass` on all three |

Breakdown of the 26: 12 ports, 8 newly authored UATs, 1 test-harness correction,
2 AC body edits, 3 field updates.

## Verification

**17 files, 139 passed, 21 skipped, 0 failed** — every file touched across all
three calls plus their adjacent siblings. The 21 skips are browser-gated cases,
and every one of them now sits in a file that also carries headless assertions for
the same AC.

**Two untouched files fail in this sandbox and I could not make them pass.**
`tests/capture.test.ts` and `tests/bug27-nested-backdrop-capture.test.ts` abort
with `EPERM: listen 127.0.0.1` — the sandbox intermittently denies the loopback
bind their fixture servers need. Evidence that this is environmental and not mine:
both files are byte-identical to HEAD (`git diff` empty); `capture.test.ts` fails
the same way run *alone*; and **no production file was modified in any of the three
calls** (`git diff HEAD~14 HEAD -- tools/ packages/` is empty, working tree has no
non-test changes), so a test exercising only production code cannot have been
broken by this work. Reporting it rather than filtering it out of the summary.

This is also why `vitest run tests/` did not complete in the previous call: those
two files burn 120s each timing out on the bind.

## Code Edits (if any)

None — in this call or in either previous one. Every finding resolved as a test or
matrix edit. Findings 1, 2 and 4 were each checked against the implementation
first and the code was correct in all three; the only production-adjacent claim I
raised (AC-1307's unsupported bullet, call one) was resolved by correcting the AC
to match REQ-72, not by changing code.

## Forwarded to the assessor — two things I did not act on

| Item | Detail |
|---|---|
| Possibly-dead classifier rule | `collapseMultiViewport` marks a defect structural when `text` starts with `§` and `property` starts with `padding` (`fidelity.ts:354`), but AC-1313 retired the band-padding comparison and `§<n>` rows now carry only `overlay` / `contentAnchor` / `textAlign` (`values-diff.ts:2555-2583`). AC-1288 requires the rule, so I proved it with a directly-constructed delta and flagged it. Whether it is dead code or a contract for an axis that may return is above this level |
| `--clusters` over `--collapse` precedence | AC-1289's precedence clause lives at `index.ts:797` behind `--multi-viewport`, which needs a real render. I covered the flags parsing as independent booleans and the two documents being observably different shapes; **the precedence branch itself remains unproven by test** |

## needs_review Items Forwarded

None. No finding in `report-68170dfc` was categorised `needs_review`.

## Standing caveat for the assessor

No Chromium is provisioned in this runner. Across all three calls I authored one
browser-gated test that has never been executed —
`test_UAT_AC1307_oklch_and_color_mix_stops_capture_as_hex` and its fixture
`tests/fixtures/capture/gradient-oklch.html` (call one). It mirrors a passing
sibling and shares its fixture-server helper, but it should be confirmed on a
runner with a browser. Every other test referenced in these three reports has been
run and observed passing or skipping.
