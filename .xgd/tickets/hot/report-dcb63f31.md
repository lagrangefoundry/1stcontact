---
uid: report-dcb63f31
id: REPORT-2417
type: report
title: 'UAT Coverage: Framework Substrate: L1 Layout, Values & Behavior Modules'
created_by: xgd
created_at: '2026-08-20T10:40:21.596405+00:00'
updated_at: '2026-08-20T10:40:21.596405+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ae9d65d6
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: Framework Substrate: L1 Layout, Values & Behavior Modules

**Result**: PASS
**AC verdicts**: 103 pass, 0 fail, 1 deprecated, 0 needs_review
**Story verdicts**: 7 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-2485c83c · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 7

Scope: **7 stories**, **104 ACs** — 100 `active`, 3 `pending` (AC-719, AC-1343,
AC-1344), 1 `deprecated` (AC-718). **103 live ACs.**

## Both violations of REPORT-2415 are closed — each re-verified, not taken on trust

The fix loop (REPORT-2416, commit `5a571a753`) closed the two violations this
assessment raised 18 minutes earlier. I re-located each at file:line and **ran
them**; I did not accept the loop's claim.

**The criteria were not weakened to fit the tests.** This was the specific failure
mode REPORT-2415 warned against, so I checked it directly with `xgd ticket history`:
the only change to `acceptance_criterion-78efd0d5` (AC-1344) since my report is
`uat_coverage: fail → pass` — the Criterion and Verification prose is **byte-identical**.
Same for AC-1343. The gap was closed by writing tests, which is the correct lever.

| REPORT-2415 finding | Repair | Verified |
|---|---|---|
| **V1 — AC-1344**: headline claim unexercised; `assertModuleConforms` never called with `mountInL1`; the "conforms standalone, fails mounted" defect class untested; seam-spans-viewport unasserted | uat-add ×5 | **Confirmed.** `test_UAT_AC1344_conformance_discriminates_in_both_shipping_shapes` (`:645`) now drives the **real `assertModuleConforms`** twice over a deliberately-throwing catalog entry (`fc-throws`, `resolveModule: resolveThrows`) — once standalone, once `mountInL1: true` — and compares the reported **AC set**, not merely pass/fail, so a mounted run that quietly checked an easier obligation could not pass. `test_UAT_AC1344_mounted_host_seam_spans_the_viewport_at_every_probed_width` (`:596`) asserts the geometry claim against `conformanceL1HostDocument()` structurally (a keyframe at every `LADDER` width, each one the viewport identity — checked as px-equals-breakpoint or a slope-1 `calc` interpolation, rather than sampled at one probe). `test_UAT_AC1344_a_defect_visible_only_when_mounted_is_reported_as_failing` (`:699`) injects `[data-l1-slot] .contact-form { width: 4000px }` — a rule inert standalone that bites only once mounted — exactly the defect class the AC exists to catch |
| **V2 — AC-1343**: cases 7 and 8 (the two "deliberately legal" compositions) unexercised, so an over-tightened "every seam must be bound" implementation would keep the suite green | uat-add | **Confirmed.** `test_UAT_AC1343_deliberately_legal_compositions_are_not_rejected` (`:285`) drives the real `validateSite` over three acceptance cases: a lone unbound seam, the **mixed** case a reproduction actually hits (two seams, one bound and one waiting — proving the rule is per-seam, not per-page), and the empty starter with neither `modules` nor `l1`. It asserts `result.errors` is `[]` **by name** rather than `ok === true`, so a failure says which over-tightening caused it |

## Execution — the load-bearing arm runs green in this worktree

`npm test -- tests/req93-l1-slot-mounted-behaviors.test.ts --reporter=verbose`:

| Test | Result |
|---|---|
| `test_UAT_AC1343_slot_bound_module_accompanies_an_l1_page` | ✓ |
| `test_UAT_AC1343_unresolvable_bindings_fail_with_a_machine_readable_path` | ✓ |
| `test_UAT_AC1343_deliberately_legal_compositions_are_not_rejected` | ✓ **(the repair)** |
| `test_UAT_AC1344_mounted_host_seam_spans_the_viewport_at_every_probed_width` | ✓ **(the repair)** |
| `test_UAT_AC1344_conformance_discriminates_in_both_shipping_shapes` | ✓ **(the repair — the headline claim)** |
| `test_UAT_AC1344_both_shipping_shapes_conform_and_report_a_per_dimension_outcome` | × EPERM (socket) |
| `test_UAT_AC1344_browser_dimensions_run_over_the_same_ac_set_in_both_shapes` | ↓ skipped (no engine) |
| `test_UAT_AC1344_a_defect_visible_only_when_mounted_is_reported_as_failing` | ↓ skipped (no engine) |
| `test_UAT_AC1344_mounted_behavior_carries_its_conformance_obligations` | × EPERM (socket) |

**File total: 13 passed, 2 failed (EPERM), 2 skipped.**

The decisive point: **AC-1344's headline claim is now proven by a test that actually
executes here.** The repair deliberately routes the discriminator through the
`isolation` dimension with a core that throws during SSR — so `serveOneModulePage`
fails at the render step *before* `startServe`, and the proof needs no socket and no
browser. That is a genuinely well-chosen design, not a workaround: it puts the
load-bearing assertion on the far side of the environment's only limitation.

The arms that cannot run here fail loudly (EPERM) or skip honestly via
`it.runIf(await chromiumAvailable())` (`:149`). **None passes silently.**

I also confirmed `extraCss` is a real, honoured option rather than an inert
parameter that would make the skipped `:699` arm vacuous — `types.ts:65` declares
it, `harness.ts:198` forwards it to `renderSite`, and `render.ts:256-259` appends it
to the served `theme.css`.

## No regression from the production half of the fix

The fix touched two production files. The change is minimal and behaviour-preserving:
`l1HostDocument([...RESPONSIVE_WIDTHS])` is extracted as an exported
`conformanceL1HostDocument()` (`harness.ts:113-123`) and `oneModulePage` now calls
it (`:158`), so — as its comment says — the host under test and the host that ships
cannot drift. `index.ts` re-exports it. No logic changed.

Re-ran the conformance-dependent surface to confirm:

| Files | Result |
|---|---|
| behavior-modules / behavior-l1-composition / contact-form-enhancement-gate / relocatable-output / reproduction-treatments | 19 passed, 2 EPERM (AC-703, AC-888) — **identical to the pre-fix run** |
| req39 / req40 / req41 conformance harness self-tests | 1 failed, 15 skipped — the failure is the same `listen EPERM` timeout, not the new export |

## Cumulative Intent Considered

Unchanged from REPORT-2415; statuses re-queried, none moved.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-63/79/82/83/84 (BUNDLE-7) | free_and_reconciled | 2026-07-22 | L1 typed substrate + envelope + sole renderer; semantic layout modules and ~20 dials deleted | YES |
| REQ-85 | free_and_reconciled | 2026-07-20 | Reframe carousel / contact-form as vetted behavior modules | YES |
| REQ-87 | free_and_reconciled | 2026-07-21 | `capability module` → **behavior module**; no back-compat alias | YES |
| REQ-90 / REQ-91 | free_and_reconciled | 2026-07-23 | Resource table + `@font-face`; captured pixel-mover axes | YES |
| REQ-93 | free_and_reconciled | 2026-07-25 | Page-level slot binding, renderer mount, `mountInL1`, `labelMode` | YES — **both repairs land here** |
| REQ-96…107 + BUG-28 (BUNDLE-11) | free_and_reconciled | 2026-07-26+ | `control` leaf + zero-CSS contract; shared axis groups; interaction/motion/texture; layout track; link role | YES |
| REQ-108…113 + BUG-30 (BUNDLE-13) | free_and_reconciled | 2026-08-06 | Pointer accent; relocatable document-relative emission | YES |
| BUG-31 + REQ-114 + REQ-116 (BUNDLE-14) | free_and_reconciled | 2026-07-31 | Palette colour model; closed colour-role vocabulary deleted | YES |
| REQ-117 | free_and_reconciled | 2026-07-31 | nowrap captured width becomes a floor | YES (AC-1009…1012) |
| REQ-136 | free_and_reconciled | 2026-08-12 | Image framing / shape / colour adjustment | YES (AC-1124…1128) |
| BUG-34 + REQ-137 (BUNDLE-18) | free_and_reconciled | 2026-08-12 | Palette `shade` replaces named `steps` | YES (AC-928, AC-1144/1145) |
| REQ-145 / REQ-148 | ready_to_reconcile | 2026-08-15 | L1 + behavior-module render move into workerd | imminent — no uat gap |
| REQ-112 / REQ-134 | abandoned | — | — | NO |

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-80 Absolute values re-homed in L1 | REQ-84, REQ-114, REQ-137 | aligned | 7/7 substantive |
| STORY-81 Responsive layout track | REQ-104 | aligned | 6/6 substantive |
| STORY-82 Reproduction treatments | REQ-84, REQ-85, REQ-87, REQ-93, REQ-96 | aligned | Body repaired 2026-08-20T08:03 after five stale cycles. AC-719 pass, AC-718 correctly deprecated |
| STORY-83 L1 layout substrate | REQ-82…REQ-136 | aligned | 43/43 substantive |
| STORY-85 Behavior modules | REQ-85, REQ-87, REQ-93, REQ-96, REQ-116 | **aligned — now covered** | Its In-scope list closes with "conformance is exercised in both shipping shapes, standalone and mounted into an L1 seam". That promise is now kept by `test_UAT_AC1344_conformance_discriminates_in_both_shipping_shapes`, which runs the real obligation set in both shapes and compares the reported AC set. 17/17 ACs pass |
| STORY-90 Interaction / motion / pointer accent | REQ-99, REQ-100, REQ-108 | aligned | 19/19 substantive |
| STORY-91 L1 navigation | REQ-106, REQ-115 | aligned | 10/10 substantive |

## Evidence Assessment

All 103 live ACs resolve to a real `test_UAT_AC<n>_*` definition; deprecated AC-718
correctly has none. The four-shape screen over all 22 CAP-70 files remains clean:
**0 internal mocks** (`vi.mock`/`vi.doMock` absent capability-wide), **0 silent
engine skips**, **0 existence-only assertions**, 2 production-source text reads (both
supplementary to behavioural assertions, in the AC-722 residual-`Capability*` sweep).
The single `vi.spyOn` inside the capability fakes a DOM API — an external boundary
TEST-STRATEGY permits.

**Scope note on breadth, carried forward honestly.** I did not re-read all 103
passing test bodies this cycle. Those verdicts rest on my own AC→test resolution
scan, the automated screen, execution, the per-AC substantive readings of the
preceding cycles, and fresh full reads of every element touched by a recent finding.
`git log` confirms the only ticket mutations since REPORT-2415 were AC-1343, AC-1344
and STORY-85 — so the other 101 AC verdicts carry forward unchanged by construction,
not by assumption.

## Findings — Categorized by Editor Action

None. Zero violations, zero warnings, zero needs_review.

## Notes for the Editor

**Nothing to action in this capability.** After eight cycles the matrix and the
evidence agree: 103 live ACs substantively covered, 7 stories aligned and covered,
the two long-running structural drifts (STORY-82's frozen body, STORY-83's missing
mount narrative) repaired, and the two coverage gaps this loop opened now closed by
tests rather than by prose edits.

**Three ACs remain unexecutable in a sandboxed worktree** — AC-703, AC-888 and one
arm of AC-1344 all die on `listen EPERM: operation not permitted 0.0.0.0` from
`tools/generate/src/cli/serve.ts:54` before any assertion runs. Their verdicts rest
on their bodies plus, for AC-1344, a sibling arm that proves the same claim without a
socket. This is an environment constraint, not a matrix defect, and it has now
recurred across four consecutive cycles — **if these ACs are to be provable in CI
sandboxes, the loopback-serve dependency is the thing to address**, not the tests.

**Still worth a tooling ticket (unchanged from REPORT-2415):** `.xgd/uat_index.json`
is empty (`{"acs": {}}`). Every coverage assessor is hand-scanning `tests/` to work
around it; followed literally, Step 1b would report 103 fabricated `uat-add` gaps.
That is a defect in the assessment tooling, not in this capability.
