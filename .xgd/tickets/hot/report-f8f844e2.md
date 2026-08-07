---
uid: report-f8f844e2
id: REPORT-1649
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=uat)'
created_by: xgd
created_at: '2026-08-07T23:03:30.997825+00:00'
updated_at: '2026-08-07T23:03:30.997825+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: uat
  violations: 4
  warnings: 4
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: uat

**Result**: FAIL
**Violations**: 4
**Warnings**: 4
**Needs review**: 0

Scope: the 48 distinct ACs across the five stories of `capability-aa030c83`
(CAP-63) — STORY-75 (14), STORY-76 (5), STORY-77 (8), STORY-78 (9), STORY-79 (12).

**Coverage is structurally complete**: every one of the 48 ACs has at least one
`test_UAT_AC<n>_*` test in `tests/`. No AC is testless. The failures are all
*consistency* (the test does not exercise what its AC claims) or *sub-clause
coverage* (the AC's Verification names legs no test reaches).

Per the level cascade, **AC bodies are the working reference**. Intent was
consulted in exactly one place — AC-637, where the AC body is itself stale
(finding 7, already filed at ac level).

**Three of the four violations are carried forward unrepaired** from the last
uat-level pass (`report-a85d40c2`, 2026-08-05, findings 1–3). All three test
files are untouched since: `reconciliation-1c-cli-output-hygiene.test.ts`,
`reconciliation-size-aware-diff.test.ts` and
`reconciliation-1c-aligned-crops-sandbox-routing.test.ts` each still sit at their
original `reconciliation_uat_generation_prompt` commit. Finding 4 (AC-815) is
**new** — AC-815 was authored 2026-08-06, after that report.

## Cumulative Intent Considered

Condensed from the ledger established at story level this cycle
(`report-f150ba1e` / REPORT-1643) and narrowed at ac level
(`report-cb7ea283`). At uat level nothing required re-deriving the chronology;
only AC-637 forced a consult (REQ-114).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` (REQ-58, REQ-59, REQ-61, REQ-62) | free_and_reconciled | 2026-07-17 | `intent_uid` of all five stories; `--size` + `responsive-diff` (→ STORY-77/78); gradient stops + panel gradient (→ STORY-76) | YES |
| BUNDLE-7 `bundle-31e474b9` (REQ-63, REQ-79, REQ-82/83/84) | free_and_reconciled | 2026-07-22 | Typography/effect axes (→ AC-711…714); aligned-crops sandbox routing (→ AC-720). REQ-79/84 retired the semantic layout modules | YES |
| BUNDLE-8 `bundle-cceaba25` (REQ-89, BUG-10) | free_and_reconciled | 2026-07-29 | Quiet bootstrap + on-demand Astro container (→ AC-738/739); painted-marker precondition (→ AC-711) | YES |
| **REQ-114** `request-3cd338cd` | **free_and_reconciled** | 2026-07-31 | **L1 palette colour model: literal base, palette overlay. Retired the palette-role alias — the ground for finding 7** | YES (retires) |
| BUNDLE-11 `bundle-ee56a66e` (BUG-27) | free_and_reconciled | 2026-08-05 | Backdrop / collapsed-subtree capture ask (→ AC-815/816/817) | YES |
| BUNDLE-16 `bundle-15c1f647` (REQ-44) | free_and_reconciled | 2026-08-07 | Per-command dependency preflight (→ AC-1013…AC-1017) | YES |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| **STORY-75** `story-d5de22a5` — 14 ACs | REQ-58, REQ-63, BUG-10, BUG-27 | **1 violation, 1 warning.** AC-629/630/631/632/633 drive the real `diffManifests` engine (`reconcile-values-diff-fidelity.test.ts`); AC-711…715 likewise (`…-treatments.test.ts`), AC-711 additionally proven capture-side under jsdom. AC-816 (8 tests: 4 real-Chromium capture + 4 pure `foldToL1`) and AC-817 (3 × `diffManifests`) are exemplary — a browser leg *and* an environment-independent leg. AC-818 drives the real `extractFields`. **AC-815 is the outlier** (finding 4 + warning 6): two browser-only tests, two of its four named Verification legs unexercised |
| **STORY-76** `story-82eb6908` — 5 ACs | REQ-59, REQ-62, REQ-114 (retires) | **aligned at uat level.** AC-634/635/636/638 drive the real `diffManifests` / `validateModuleContent`; the stop-position, positionless-stop, present-vs-missing and malformed-value legs each land. AC-637's test diverges from its AC's Verification, but the **AC** is what is stale — already filed at ac level (finding 7, info) |
| **STORY-77** `story-16f2793c` — 8 ACs | REQ-61, REQ-58 (ladder) | **1 violation, 1 warning.** AC-640/641/642/644/645/647 drive `cmdValuesDiff` / `cmdDiff` / `cmdCapturePage` / `run(argv)` for real, including the fail-loud paths and the no-image-bytes matrix check. **AC-643 (finding 2) and AC-639 (warning 5) share one blind spot**: both inject a pre-made actual side, so neither command's `--size`→actual-render forwarding is ever executed |
| **STORY-78** `story-2c7069fe` — 9 ACs | REQ-61 | **aligned — the strongest story in the capability.** All nine ACs drive `run(argv)` at the true CLI boundary via the `runCli` harness (`reconciliation-responsive-diff.test.ts:74-90`), asserting parsed JSON, human output ordering, exit codes and persisted files. AC-653/654 prove the terminal-fails emit no partial table |
| **STORY-79** `story-e15a19ef` — 12 ACs | REQ-58, REQ-79, REQ-89, REQ-44 | **2 violations, 1 warning.** AC-738 spawns the real `1c` binary as a subprocess; AC-739 spies real container construction across three real renders; AC-1013…1017 are outstanding — `assertInstall` unit legs *plus* real-binary subprocess legs with a module-resolution hook. **AC-656 is fine** (its claim genuinely is a `parseArgs` property). **AC-657 (finding 1), AC-720 (finding 3) and AC-658 (warning 4) are the gaps** — each stops at an internal seam its AC states as a property of the command |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-657 `acceptance_criterion-9c235ff1` (STORY-79 `story-e15a19ef`) | uat-edit | **Carried forward unrepaired** from `report-a85d40c2` finding 1; file untouched since. AC-657's claim is a property of *the command* ("everything written to stdout is exactly one well-formed JSON document") and its Verification says "**Run a `values-diff --json` command** and capture stdout only". `test_UAT_AC657_json_is_exactly_one_parseable_document` (`tests/reconciliation-1c-cli-output-hygiene.test.ts:53-94`) never invokes `values-diff`: it calls `withCleanStdout` directly, writes three fake diagnostics inside it, then **writes the JSON document itself** (`:77`) and parses what it just wrote (`:86`). Its docstring concedes this — "Faithful reproduction of run()'s `--json` path". Re-verified this pass: **no test anywhere drives the values-diff success emit** (`grep "run(\['values-diff"` → no matches). The real path is `tools/generate/src/cli/index.ts:780-793` — the compute wrapped at `:780`, `console.log(JSON.stringify(report, null, 2))` at `:793`. The nearest thing, `test_UAT_AC1016_refusal_is_environment_exit_6_and_json_envelope` (`…install-preflight.test.ts:422`), reaches only the **preflight refusal envelope**, exiting before the diff emit. **Failure mode:** add any second `console.log` to the values-diff case — a summary line, a stray `formatReport` — and stdout carries two documents, `\| jq` breaks, AC-657 is violated in production, and this UAT stays green because it never observed the command's stdout | Rewrite to invoke `run(['values-diff', slug, '--ref', <bundle>, '--actual', <manifest>, '--json'])` and assert the **entire** captured stdout parses as one JSON document equal to the report. Both halves of the harness already exist in-repo: offline `cmdValuesDiff` driving at `…size-aware-diff.test.ts:157`, and the stdout/exit-code capture at `…responsive-diff.test.ts:74-90`. Keep the diagnostic-absence assertions |
| 2 | violation | consistency | AC-643 `acceptance_criterion-2ca1d9b9` (STORY-77 `story-16f2793c`) | uat-edit | **Carried forward unrepaired** from `report-a85d40c2` finding 2; file untouched since. AC-643 has two clauses — "**shoots the reproduction at the selected viewport** *and* compares it against the reference bundle's same-width screenshot" — and its Verification names both: "assert **the reproduction is rendered/shot at the tablet viewport** *and* the reference image used is the tablet-width one". `test_UAT_AC643_pixel_diff_size_pairs_reproduction_against_same_width_reference` (`tests/reconciliation-size-aware-diff.test.ts:212-235`) asserts only the second: it passes `actualImagePath` (`:226`), which takes the `if (!actualImage)` branch at `tools/generate/src/cli/perceptual.ts:483` **out of play entirely**. The unexercised line is `viewport: opts.size` at `perceptual.ts:493` — the sole forwarding of `--size` into `cmdShot`. **Failure mode:** delete `perceptual.ts:493` and every AC in this capability still passes, while `1c diff --size mobile` shoots the reproduction at desktop and diffs it against the 390px reference — a maximal all-red pixel report that misattributes a viewport bug to fidelity drift. The sibling `test_UAT_FC_REQ-61_pixel_size_selects_matching_width_screenshot` (`tests/req61-size-pixel-diff.test.ts:35`) is the identical shape and equally blind | Add a leg driving `cmdDiff` **without** `actualImagePath` — supply `slug` plus a fake `driverFactory` (the `MarkerScreenshotDriver` at `…size-aware-diff.test.ts:312` is the ready-made pattern, as is `tests/shot.test.ts:133`) and assert the driver's `screenshot` received `VIEWPORTS.tablet` |
| 3 | violation | coverage | AC-720 `acceptance_criterion-72db61ca` (STORY-79 `story-e15a19ef`) | uat-edit (or ac-edit) | **Carried forward unrepaired** from `report-a85d40c2` finding 3; file untouched since. AC-720's Criterion bullet 1 and its Verification both close on an **end-to-end** observable: "the drift-aligned ref/ours crop pairs are emitted from that sandbox reproduction (for a real sandbox reproduction with matching anchors, a non-empty set of crop pairs is produced)" / "End-to-end, `1c aligned-crops <slug> --sandbox` … emits a non-empty set of crop pairs from the sandbox build." `test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve` (`tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:33-75`) covers only the pure `subRenderOptions` seam, and the file's own docstring still states the rest is not automated: "the browser + sharp crop pipeline downstream of it is the orchestrator (the commit's end-to-end check — 7 crop pairs from a rendered sandbox reproduction — is **manual**)" (`:16-19`). The matrix therefore advertises evidence that exists only as a one-time manual observation. This matters more than ordinary options-plumbing because the regression AC-720 exists to prevent — "`--sandbox` was ignored by the render/serve step … so that no valid crops could be produced" — is *defined* by crop-pair emptiness, which the seam test cannot see: `subRenderOptions` can return a perfectly-shaped object that a caller then ignores | Either (a) add a browser-gated end-to-end leg asserting a non-empty crop-pair set from a rendered sandbox reproduction — the repo's `it.runIf(browserOk)` idiom (`tests/req62-gradient-panel.test.ts:34`, `tests/req58-wrapper-treatments.test.ts:32`) exists for exactly this; or (b) if judged genuinely un-automatable, **ac-edit** AC-720 to drop the end-to-end clause from its Criterion and Verification. Do not leave the AC asserting a manual check |
| 4 | violation | coverage | AC-815 `acceptance_criterion-9ccc1de8` (STORY-75 `story-d5de22a5`) | uat-edit | **New this pass** (AC-815 authored 2026-08-06, after the last uat-level report). AC-815's Verification names **four** assertions; only two are made. Its two tests are `test_UAT_AC815_collapsed_header_subtree_is_captured` and `test_UAT_AC815_offscreen_block_does_not_become_or_inflate_a_band` (`tests/bug27-nested-backdrop-capture.test.ts:124`, `:137`), both driving the real `cmdCapturePage` against `tests/fixtures/capture/bug27-nested-backdrop.html`. Covered: the collapsed header (logo + nav links reach the manifest) and the off-canvas block. **Unexercised (a):** "an overflow-clipped carousel with off-stage slides … assert the carousel's band is no wider than the document". The fixture contains **no `overflow` declaration at all** (verified: its only `position`/`hidden` rules are the header, hero, veiled-scrim and `.offscreen` blocks, lines 16-61) — so the clip-vs-extend clamp, which the Criterion makes load-bearing in both directions ("Overflow that genuinely extends the document grows the canvas and is kept; overflow that is clipped does not and is cut"), never runs. That clamp is `Math.min(docW, …)` / `Math.min(docH, …)` at `tools/generate/src/cli/capture/extract.ts:497-499`, whose own comment names the missing fixture verbatim ("a carousel's off-stage slides under overflow:hidden"). The one width assertion present (`:143`, `s.box.width <= cap.viewport.width + 1`) is satisfied by the off-canvas case, which is decided earlier and by a different mechanism — `onScreenBox` rejection in the descendant loop at `extract.ts:483` — so it does not stand in for the `docW` clamp. **Unexercised (b):** "assert a conventional band's box is unchanged from its own border box" — asserted nowhere; the code comment at `extract.ts:472-473` claims exactly this property ("leaves a conventionally-laid-out band unchanged … the union IS its own box") with no test behind it. **Failure mode:** replace `Math.min(docW, acc.x + acc.width)` with `acc.x + acc.width` and both AC-815 tests still pass, while any site with an `overflow: hidden` carousel captures a band hundreds of px wider than the page — re-opening precisely the class of defect BUG-27 closed | Extend `bug27-nested-backdrop.html` with (i) an `overflow: hidden` carousel whose slides extend well past its box, and (ii) a conventionally laid-out band. Add assertions that the carousel's band width is bounded by the document's `scrollWidth` (not merely the viewport), and that the conventional band's captured box equals its own border box |
| 5 | warning | consistency | AC-658 `acceptance_criterion-7f078026` (STORY-79 `story-e15a19ef`) | uat-edit | Carried forward from `report-a85d40c2` finding 4. Same shape as finding 1, one degree weaker. AC-658's Verification says "**Run a `values-diff` command** under conditions that trigger render chatter and capture stdout and stderr separately"; `test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr` (`tests/reconciliation-1c-cli-output-hygiene.test.ts:100-132`) instead calls `withCleanStdout` with three hand-written diagnostics and checks the stream split. Weaker because the AC's load-bearing mechanism genuinely *is* the wrapper (the AC names it) and the test file declares its boundary honestly at `:13-19`. But nothing proves the CLI still *wraps* the values-diff compute — remove the `withCleanStdout(…)` call at `tools/generate/src/cli/index.ts:780` and this test stays green while every render diagnostic lands on stdout | Fold into finding 1's fix: once the UAT drives `run(['values-diff', …])`, assert the stream split there |
| 6 | warning | consistency | AC-639 `acceptance_criterion-c6534e1a` (STORY-77 `story-16f2793c`) | uat-edit | Carried forward from `report-a85d40c2` finding 5; unrepaired (`:118` still supplies `actualManifestPath`). AC-639's Criterion states "the reference values are those captured at the selected size's width **and the reproduction is rendered at that same viewport**". `test_UAT_AC639_values_diff_size_compares_at_selected_viewport_width` (`tests/reconciliation-size-aware-diff.test.ts:109-132`) injects the actual side as a manifest, so the second clause is unexercised — the unguarded line is `extractDraftManifest(opts.slug, …, viewport)` at `tools/generate/src/cli/fidelity.ts:167`, the values-diff twin of finding 2's `perceptual.ts:493`. Filed as a warning rather than a violation because AC-639's *Verification* asks only to confirm the reference values come from the ladder at the selected width — which the test does precisely, via `expectedSource` (`:124-125`). The gap is between Criterion and Verification, not between Verification and test | Add the mirror leg to finding 2's fix: drive `cmdValuesDiff` with a `slug` + fake `driverFactory` and assert the driver was sized to `VIEWPORTS[size]`. Fixing 2 and 6 together closes both size-aware commands' actual-side seam |
| 7 | warning | coverage | AC-631 `acceptance_criterion-65b5ddd3` (STORY-75 `story-d5de22a5`) | uat-add | Carried forward from `report-a85d40c2` finding 6; unrepaired (`:86-87` still hand-derives the blend). AC-631's Criterion is "the surface colour **captured and compared** … is its effective rendered colour after compositing", and its Verification opens "**Capture** a fixture containing a translucent white card over a tinted band **and diff it**". `test_UAT_AC631_surface_fill_is_composited_alpha_colour` (`tests/reconcile-values-diff-fidelity.test.ts:73-101`) owns only the compare leg. It cites the capture leg's owner honestly (`:12-14`, `:82-84`): `test_UAT_FC_REQ-58_surface_fill_composites_translucent_over_band` (`tests/req58-wrapper-treatments.test.ts:71`). That sibling is real and correct but **browser-gated** — `itB = it.runIf(browserOk)` at `:32` — so where Chromium is absent the capture leg has no executing evidence. The remedy pattern already exists inside this same story: AC-711's capture leg is proven by `test_UAT_AC711_list_marker_recorded_only_where_a_marker_is_painted` (`tests/reconciliation-capture-list-marker.test.ts:59`), which runs the real `EXTRACT_SCRIPT` under jsdom, environment-independent | Author an AC-711-style UAT for AC-631's capture leg: mount a translucent card over a tinted band, run the real `EXTRACT_SCRIPT` under jsdom, assert the captured `surfaceFill` is the blended tint, not `#ffffff` |
| 8 | warning | consistency | AC-815 `acceptance_criterion-9ccc1de8` (STORY-75) — test harness | uat-edit | **New this pass.** AC-815's only two tests use the local `itA` helper (`tests/bug27-nested-backdrop-capture.test.ts:80-84`), which on an unavailable Chromium does `if (!capture) return // skip silently` — the test reports **PASS with zero assertions executed**, rather than SKIP. AC-815 is the only AC in this capability whose *entire* evidence is browser-gated this way (AC-816 uses the same helper but is backed by four browser-free `foldToL1` tests at `:213-244`; AC-817's three tests need no browser at all). The repo's own idiom elsewhere — `it.runIf(browserOk)` (`req62-gradient-panel.test.ts:34`, `req58-wrapper-treatments.test.ts:32`) — marks the test *skipped*, which is visible in the run report; the silent return is not. Distinct from finding 4: that one is about missing assertions, this one is about green evidence that may never have run | Switch `itA` to `it.runIf(browserOk)` so an absent browser shows as a skip, and/or add a browser-free leg for AC-815's clamp arithmetic in the shape of AC-816's `foldToL1` tests |
| 9 | info | — | AC-637 `acceptance_criterion-377af866` (STORY-76 `story-82eb6908`) | — | `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` (`tests/req62-gradient-panel.test.ts:69-88`) drives the real `resolveSurfaceGradient` and passes. It deliberately diverges from AC-637's **Verification**, which still demands a palette-role stop resolving to `var(--color-<role>)`: the test uses two hex literals and its comment (`:75-80`) cites REQ-114 (`request-3cd338cd`, free_and_reconciled, 2026-07-31), which retired the palette-role alias. **The test is right and the AC is stale.** Already filed as violations 1–3 of `report-cb7ea283` (ac level, still open). No uat-level action — repairing the AC will make the test match | none — resolve at ac level |
| 10 | info | — | AC-711 `acceptance_criterion-7c503447`; AC-816; AC-1013; AC-1016 | — | Exclusivity checked across all multi-test ACs. None are redundant: AC-711's two tests split diff-side (`diffManifests`) from capture-side (real `EXTRACT_SCRIPT` under jsdom); AC-816's eight split real-Chromium capture from pure `foldToL1`; AC-1013's and AC-1016's two each split in-process `run()` from a real-binary subprocess under a module-resolution hook, and each test's comment states precisely why the other cannot substitute (`…install-preflight.test.ts:269-277`, `:440-444`). These are different test *shapes*, which the check treats as complementary | none |

## Notes for the Editor

**One cross-cutting pattern accounts for findings 1, 2, 5 and 6.** Four ACs state
a property of a *command* but are tested at an internal seam one layer below it:
AC-657/658 stop at `withCleanStdout` instead of `run(['values-diff', …])`;
AC-643/639 inject a pre-made actual side instead of letting the command render
one. In each case the line that actually implements the AC
(`index.ts:780`/`:793`, `perceptual.ts:493`, `fidelity.ts:167`) can be deleted
with the whole capability still green. All four are fixable with harnesses that
already exist in this repo — `runCli` at `…responsive-diff.test.ts:74-90` and the
fake-`driverFactory` pattern at `…size-aware-diff.test.ts:312`. Fixing them as
one batch is cheaper than four separate passes, and would clear two violations
and two warnings.

**Findings 4 and 8 both land on AC-815 and should be repaired together** — the
fixture needs new elements (the overflow-clipped carousel, the conventional band)
*and* the harness needs to stop passing silently when the browser is absent.
Repairing only the assertions leaves them potentially never executed.

**A note on the coverage/consistency split.** This capability has no testless AC
and no redundant test — structurally it is in good shape, and STORY-78 in
particular (nine ACs, all driven through `run(argv)`) is the model the other four
stories should be measured against. Every finding here is about *depth of
evidence*, not absence of it. Findings 1–3 have now survived two consecutive
uat-level passes untouched; if the fix loop is not reaching these files, that is
worth investigating before a third pass files them again.

**Upper layers are open.** Both `report-f150ba1e` (story, 8 violations) and
`report-cb7ea283` (ac, 4 violations) failed this cycle and remain unrepaired.
Finding 9 is a direct consequence — AC-637's stale body cannot be resolved at
this level. Story-level finding 1 (the capability body's Scope bullet 4 not
covering STORY-79's guarantees 3–5) does not change any uat-level verdict here,
but a downstream editor should sequence story → ac → uat rather than repairing
this report's findings in isolation.
