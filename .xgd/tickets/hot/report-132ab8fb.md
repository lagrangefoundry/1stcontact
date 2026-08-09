---
uid: report-132ab8fb
id: REPORT-1724
type: report
title: 'UAT Coverage: 1c_capture_diff_fidelity'
created_by: xgd
created_at: '2026-08-09T02:57:24.343307+00:00'
updated_at: '2026-08-09T02:57:24.343307+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-aa030c83
  violations: 8
  warnings: 6
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c_capture_diff_fidelity

**Result**: FAIL
**AC verdicts**: 41 pass, 6 fail, 1 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 3 fail, 1 stale, 0 needs_review
**Capability verdict**: fail

Evidence was read from the test sources AND executed. All 11 test files
carrying this capability's UATs were run under vitest in this worktree:
`9 files / 48 passed / 2 skipped` plus `2 files / 11 passed / 2 skipped`
plus `2 files / 18 passed / 3 skipped`. Chromium is **not available** here,
which is what exposed finding #2 below.

## Cumulative Intent Considered

Every intent below is `free_and_reconciled` — all count toward cumulative intent.
Stories carry `intent_uid: bundle-ab9e0cb6`; STORY-75 adds
`updated_by: [bundle-cceaba25, bundle-ee56a66e]`, STORY-79 adds
`updated_by: bundle-15c1f647` and cites bundle-31e474b9 / bundle-cceaba25 in its body.

| Intent ID | Bundle | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-44 | BUNDLE-16 | free_and_reconciled | 2026-07-03 | Fail loud on out-of-sync node_modules (install preflight) | YES |
| REQ-58 | BUNDLE-6 | free_and_reconciled | 2026-07-13 | gigabytealchemy re-import pass 3 — capture/diff blind spots, multi-viewport ladder | YES |
| REQ-59 | BUNDLE-6 | free_and_reconciled | 2026-07-13 | Capture gradient stop positions (text-fill) | YES |
| REQ-61 | BUNDLE-6 | free_and_reconciled | 2026-07-16 | responsive-diff N-way + `--size` size-aware diffing | YES |
| REQ-62 | BUNDLE-6 | free_and_reconciled | 2026-07-16 | Gradient panel fill: capture + render + diff | YES |
| REQ-84 | BUNDLE-7 | free_and_reconciled | 2026-07-20 | **Framework pivot C: strip layout modules to L1 — delete hero/text-block/services-grid/footer/header** | YES (retires) |
| REQ-89 | BUNDLE-8 | free_and_reconciled | 2026-07-22 | Silence "Missing pages directory" on every 1c command | YES |
| BUG-7 | BUNDLE-8 | free_and_reconciled | 2026-07-23 | evaluateLayout row/flow width bug | YES |
| BUG-27 | BUNDLE-11 | free_and_reconciled | 2026-07-25 | CSS background images / lazy media not captured (band extent + document-wide backdrops) | YES |
| REQ-96 | BUNDLE-11 | free_and_reconciled | 2026-07-26 | Behavior modules layout-agnostic; L1 `control` node; module-invariant elements | YES |
| REQ-114 | BUNDLE-11 | free_and_reconciled | 2026-07-31 | **L1 palette colour model (literal base, palette overlay)** — retires the palette-role alias stop | YES (retires) |
| REQ-115 / REQ-117 | BUNDLE-16 | free_and_reconciled | 2026-07-31 | Builder shell / copy editing | YES |

Two intents retire behavior this capability still describes:
- **REQ-84** deleted the `text-block` layout module. Verified in the tree:
  `packages/framework/src/modules/` now contains only `carousel/` and
  `contact-form/` — there is no `text-block`. The shared
  `resolveSurfaceGradient` resolver survives at
  `packages/framework/src/modules/text-style.ts:223`.
- **REQ-114** replaced the literal-or-palette-role gradient stop with
  literal-only (the AC-638 test says so in its own comment).

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-75 | REQ-58, BUG-27, REQ-96 | aligned | All 11 body items supported; 2 coverage gaps (AC-631, AC-815) |
| STORY-76 | REQ-59, REQ-62, REQ-84, REQ-114 | **stale** | Body still claims a stop colour may be "a palette-role alias (absolute-or-overlay)"; REQ-114 retired that half |
| STORY-77 | REQ-61 | aligned | Body items 1+2 ("actual side rendered/shot at that viewport") are the exact halves no test exercises |
| STORY-78 | REQ-61 | aligned | Fully covered at the `run(argv)` CLI boundary |
| STORY-79 | REQ-58, REQ-89, REQ-44, REQ-84 (via BUNDLE-7) | aligned | 2 coverage gaps (AC-657, AC-720); body itself records AC-720's check as manual |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | ac | AC-637 | ac-deprecate | AC claims "A **text-block** authored with a gradient panel renders a padded, rounded panel". REQ-84 deleted the text-block module; STORY-76's own **Out of scope** already says "no module currently owns a padded/rounded/inset gradient-panel render". `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` was silently repurposed to assert only the `resolveSurfaceGradient` CSS string, and the test file header says outright "The text-block panel that first carried it went away with the semantic layout modules (REQ-84)" | Mark `lifecycle: deprecated`, link REQ-84. Then **ac-add** a replacement AC for the surviving claim ("a gradient content value resolves via `resolveSurfaceGradient` to a `background-image: linear-gradient(...)`; under-specified → no fill") and rename the existing test to it |
| 2 | violation | uat | AC-815 | uat-edit | The AC's **only** evidence is `test_UAT_AC815_collapsed_header_subtree_is_captured` and `..._offscreen_block_does_not_become_or_inflate_a_band`. Both use the local `itA` helper (`tests/bug27-nested-backdrop-capture.test.ts:82-86`), which does `if (!capture) return` when Chromium is absent — so they report **`✓ passed 0ms` while asserting nothing**. Confirmed by running the file here: both are green with zero work done. A green vacuous test is worse than a skip: it reports coverage that does not exist | Replace the silent-return `itA` with `it.runIf(browserOk)` / `it.skipIf` so an absent browser reports **skipped**, matching the sibling `req58-wrapper-treatments.test.ts` pattern; or add a browser-free leg driving `foldToL1`/`EXTRACT_SCRIPT` so the AC keeps live evidence either way. Also: `.xgd/uat_index.json` has **no entry at all** for `ac815` — reindex |
| 3 | violation | uat | AC-631 | uat-edit | AC: "Surface fill is compared as the **effective alpha-composited** colour". `test_UAT_AC631_surface_fill_is_composited_alpha_colour` computes the blend **in the test** (`(255+217)/2` …) and feeds that literal into both manifests — it proves `diffManifests` compares a `surfaceFill` string, which AC-632's equality legs already prove. The compositing half is proven only by `test_UAT_FC_REQ-58_surface_fill_composites_translucent_over_band`, which is (a) not AC-named and (b) `↓ skipped` here | Either rename the Chromium sibling to `test_UAT_AC631_*` so the AC owns it, or extend the AC-631 test to drive `cmdCapturePage` against the committed `req58-treatments.html` fixture and assert the captured value is composited before diffing it |
| 4 | violation | uat | AC-639 | uat-edit | AC: "values-diff --size compares at the selected viewport width (reference from ladder, **actual rendered there**)". The test always passes `actualManifestPath`, which takes the early-return branch in `valuesDiffAtSize` (`tools/generate/src/cli/fidelity.ts:157-160`). The `else` branch — `extractDraftManifest(opts.slug, …, viewport)` at line 166, the only place `viewport` reaches the render — is never executed. Dropping that `viewport` argument would leave this test green | Add a leg driving the slug path with an injected `driverFactory`, asserting the viewport the driver was sized to equals `VIEWPORTS[size]` |
| 5 | violation | uat | AC-643 | uat-edit | Same shape as #4 on the pixel path. AC: "pairs the **reproduction shot at that viewport**". The test always passes `actualImagePath`, so `cmdDiff` skips the `cmdShot({… viewport: opts.size …})` branch (`tools/generate/src/cli/perceptual.ts:480-497`). Only reference *selection* (`resolveRefImage`) is proven; the shot-side half is not | Add a leg omitting `--actual` with an injected `driverFactory`, asserting the shot was taken at `VIEWPORTS[size]` |
| 6 | violation | uat | AC-657 | uat-edit | AC: "**values-diff --json** prints exactly one parseable JSON document to stdout". The test never invokes `values-diff`. It calls `withCleanStdout` directly, writes the fake Vite chatter itself, then writes `JSON.stringify(report)` itself — its own comment calls this a "Faithful reproduction of run()'s `--json` path". That is a re-implementation of the code under test. Removing the `withCleanStdout` wrapper from the real `run()` values-diff path, or adding a stray `console.log` before the document, would leave this green. (AC-658 legitimately owns the `withCleanStdout` primitive; AC-657 is meant to own the command-level guarantee and currently duplicates AC-658) | Drive `run(['values-diff', slug, '--ref', dir, '--actual', manifest, '--json'])` with `process.stdout.write` captured, and assert the captured stdout parses as exactly one document |
| 7 | violation | uat | AC-720 | uat-edit | AC: "aligned-crops --sandbox **renders, serves, and crops** the sandbox reproduction, not the sites/ build". The test only calls the pure mapper `subRenderOptions(opts)` and inspects its return value. It never invokes `cmdAlignedCrops`, so it cannot show the mapper is *used*: deleting the `subRenderOptions(opts)` call at `tools/generate/src/cli/aligned-crops.ts:196` would leave it green. The test docstring concedes "the commit's end-to-end check … is manual", and STORY-79's body records the same ("Verified: `1c aligned-crops joyfulculinary --sandbox` emits 7 crop pairs") | Drive `cmdAlignedCrops` with injected render/serve seams and assert the options they actually received; keep the `subRenderOptions` table as the unit-level companion |
| 8 | violation | story | STORY-76 | story-body-edit | Body §2 "Authored" ends: "Each stop colour is an absolute hex literal **or a palette-role alias (absolute-or-overlay)**." REQ-114 (free_and_reconciled 2026-07-31) retired the palette-role half — the tests for AC-637/AC-638 both carry an explicit REQ-114 note saying the stop is now literal-only | Delete the palette-role-alias clause; state the stop is a hex literal, noting an L1 palette reference resolves to a literal before the resolver/validator sees it |
| 9 | warning | ac | AC-816 | uat-edit | Four of AC-816's tests share the vacuous `itA` helper from finding #2 (`✓ 0ms`, no assertions, no browser). AC-816 still verdicts **pass** because its four Part-B tests (`fold_emits_backdrop_box_with_url`, `fold_paints_backdrop_beneath_content`, `fold_carries_the_fill_and_veil_of_a_backdrop`, `fold_bounds_a_band_at_a_backdrop_edge`) execute for real (7ms/1ms/1ms/2ms) — but the capture-side half is silently unproven when Chromium is missing | Fixed by the same `it.runIf` change as finding #2 |
| 10 | warning | story | STORY-77 | story-body-edit | Technical Context says "Generalizes **CAP-63 (1c Values-Diff Fidelity)**" — a capability name retired by the 2026-08-05 consolidation into "1c Capture & Diff Fidelity" | Update the cross-reference to the current capability name |
| 11 | warning | story | STORY-78 | story-body-edit | Technical Context says "Belongs to **CAP-65 (1c Size-Aware Diffing)**, whose body already reserves this downstream `responsive-diff` command" — CAP-65 was merged into CAP-63 on 2026-08-05 | Same |
| 12 | warning | story | STORY-79 | story-body-edit | Related-capabilities paragraph names "**CAP-63 (1c Values-Diff Fidelity), CAP-65 (1c Size-Aware Diffing)**" as two distinct capabilities | Same |
| 13 | warning | story | STORY-79 | field-edit | Body attributes guarantees 2–4 to `bundle-31e474b9` (BUNDLE-7) and `bundle-cceaba25` (BUNDLE-8), but `fields.updated_by` lists only `bundle-15c1f647`. Both cited bundles are `free_and_reconciled`, so the content is sound — the ledger field is just incomplete | Add `bundle-31e474b9` and `bundle-cceaba25` to `updated_by` |
| 14 | warning | ac | AC-815 | index-rebuild | `.xgd/uat_index.json` (generated 2026-08-08 17:53) carries no `ac815` key, though two `test_UAT_AC815_*` functions exist in the tree. Any tooling that reads the index sees AC-815 as untested | Rebuild the UAT index |

## Notes for the Editor

**One pattern accounts for four of the seven UAT violations (#3, #4, #5, #7): the
test drives the seam *beside* the behavior instead of the entry point that uses it.**
AC-639 and AC-643 both inject the actual side and so skip the only branch that
carries `viewport` into the render/shot; AC-720 tests the pure options mapper but
never the command that calls it; AC-631 hard-codes the composited value it is
supposed to prove is computed. In each case the *reference/selection* half is
genuinely well tested — what is missing is one added leg that omits the injected
artifact and drives the real path with a fake `driverFactory`. The fixture
machinery for this already exists in `reconciliation-size-aware-diff.test.ts`
(`MarkerScreenshotDriver`), so all four are small, mechanical additions rather
than new test infrastructure.

**Findings #2 and #9 are the same defect and should be fixed in one edit.** The
local `itA` helper at `tests/bug27-nested-backdrop-capture.test.ts:82-86` swallows
the no-browser case as a *pass* rather than a *skip*. The correct pattern is three
files away — `req58-wrapper-treatments.test.ts` and `req62-gradient-panel.test.ts`
both use `it.runIf(browserOk)` and correctly report `↓`. This is the highest-value
fix in the set: it is the difference between "we know this is unverified here" and
"the matrix says verified when nothing ran."

**Findings #1 and #8 are the REQ-84/REQ-114 tail on STORY-76 and belong in one
pass.** The story's *Out of scope* clause was already updated for REQ-84 but AC-637
was not, so the AC now contradicts its own story body. Note the resolver itself is
alive and correct — this is a wording/lifecycle correction, not a capability loss.
The capability body's own "value-axis ownership" rule (added 2026-08-08) already
anticipates exactly this: the module content-field gradient is the superseded
authoring surface, and the live L1 gradient axis is CAP-70's.

**Findings #10–#12 are one batch.** Three story bodies cite `CAP-63 (1c
Values-Diff Fidelity)` and `CAP-65 (1c Size-Aware Diffing)` as separate
capabilities; the 2026-08-05 consolidation merged CAP-63/64/65/66 into this one.
A single search-and-replace pass cleans all three.

**Not defects — recorded so the next round does not re-litigate them:**
- `test_UAT_FC_REQ-96_gigabyte_*` (2 skipped) are oracle-gated on a capture
  fixture, not on this capability's ACs. AC-818's own test runs.
- `test_UAT_FC_REQ-58_*` real-Chromium tests skipping is *correct* reporting
  behaviour; only their being AC-631's sole compositing evidence is the problem.
- The `vi.spyOn` uses in `reconciliation-responsive-diff.test.ts` (console capture)
  and `reconciliation-1c-astro-free-render.test.ts` (spying `experimental_AstroContainer.create`,
  whose *construction* is the observable AC-739 names) are legitimate — neither
  mocks an internal component.
- STORY-78's nine ACs are the strongest evidence in the capability: every one is
  driven through `run(argv)` at the real CLI boundary with a bundle authored on
  disk. STORY-79's install-preflight ACs (1013–1017) are likewise strong, using
  real `spawnSync` and an isolated uninstalled working directory.
