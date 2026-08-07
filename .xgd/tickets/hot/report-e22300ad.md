---
uid: report-e22300ad
id: REPORT-1653
type: report
title: 'UAT Coverage: 1c Capture & Diff Fidelity'
created_by: xgd
created_at: '2026-08-07T23:15:37.436329+00:00'
updated_at: '2026-08-07T23:15:37.436329+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-aa030c83
  violations: 8
  warnings: 4
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c Capture & Diff Fidelity

**Result**: FAIL
**AC verdicts**: 42 pass, 6 fail, 0 deprecated, 0 needs_review (48 ACs)
**Story verdicts**: 1 pass, 4 fail, 0 stale, 0 needs_review
**Capability verdict**: fail

Coverage is **structurally complete**: all 48 ACs carry at least one
`test_UAT_AC<n>_*` test and every one executes green. Verified this cycle, not
assumed — `vitest run` over the thirteen AC-bearing files: **13 files / 76 passed
/ 4 skipped**, 7.72s. No AC is testless and no test is redundant.

Every finding is therefore about **depth of evidence**, not absence of it. Six
ACs are covered by a test that cannot fail when the production line the AC names
is deleted; two stories carry intent-supported behaviour that reaches no AC at
all.

**One environmental fact materially changes this pass's reading.** Chromium is
**unavailable** in this worktree (the 4 skips are its `it.runIf(browserOk)`
siblings). The `itA` helper at `tests/bug27-nested-backdrop-capture.test.ts:80-84`
does `if (!capture) return` on that condition — so its tests report **PASS with
zero assertions executed**, not SKIP. The run confirms it: all six `itA` tests
report **0ms** while their browser-free neighbours in the same file report 1–7ms.
AC-815's *entire* evidence is `itA`, so in this environment it has none.

## Cumulative Intent Considered

Chronological ledger. Established at story level this cycle (`report-f150ba1e` /
REPORT-1643) and narrowed at ac level (`report-cb7ea283`); re-walked here only
where a coverage verdict turned on it. No intent in this tree is `abandoned`,
`deprecated` or `wont_fix` except REQ-80/65/69, which are correctly absent from
every AC.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 (BUNDLE-16 `bundle-15c1f647`) | free_and_reconciled | 2026-07-03, rec. 2026-08-07 | Per-command dependency preflight, `ENVIRONMENT` code | YES |
| REQ-58, REQ-59, REQ-61, REQ-62 (BUNDLE-6 `bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-13…17 | `intent_uid` of all five stories. Boolean-flag + `--json` hygiene; gradient stop positions; panel gradient; `--size` + `responsive-diff` | YES |
| REQ-63, REQ-64 (BUNDLE-6/7) | free_and_reconciled | 2026-07-17 | Capture+diff every render-affecting axis; every delta a real visible difference | YES |
| REQ-72, REQ-73, REQ-76 | free_and_reconciled | 2026-07-18 | In-browser hexify of gradient stops; `gap` axis; cause clustering. **Named in no bundle body** | YES |
| REQ-79 / REQ-84 (BUNDLE-7 `bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Framework pivot — retired the semantic layout modules (`text-block` et al.) | YES (retires) |
| BUG-16, BUG-22, BUG-24, BUG-25 (BUNDLE-10 `bundle-4ff83a8b`) | free_and_reconciled | 2026-07-23…25 | Offline re-extract vs mirrored faces; split-control surface attribution; modern-colour scrim capture; per-text-node run geometry | YES |
| REQ-89, BUG-10 (BUNDLE-8 `bundle-cceaba25`) | free_and_reconciled | 2026-07-22 | Quiet bootstrap + on-demand Astro container; painted-marker precondition | YES |
| **REQ-114** `request-3cd338cd` | free_and_reconciled | 2026-07-31 | L1 palette colour model: literal base, palette overlay. **Retired the palette-role alias** | YES (retires) |
| BUG-27 (BUNDLE-11 `bundle-ee56a66e`) | free_and_reconciled | 2026-08-05 | Backdrop / collapsed-subtree / lazy-media capture | YES |

Two ACs sit downstream of a *retirement*: AC-637 and AC-638 still describe the
palette-role stop alias REQ-114 removed. Neither is a retired **AC** — the
resolver and validator behaviours are live reconciled REQ-62 intent, and both
tests correctly assert the post-REQ-114 behaviour. The AC *bodies* are stale, not
the behaviour, so neither is deprecated here; both are `pass` on coverage with
the body drift carried as a warning for the ac-level lever.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-75 `story-d5de22a5` | REQ-63, REQ-64, BUG-10, BUG-27 | **incomplete → fail** | Body accurately describes what it covers, but BUG-16, BUG-22, BUG-24, BUG-25 (all `free_and_reconciled`, all live in `tools/generate`) reach no item in it; REQ-73 and REQ-76 reach no story anywhere. Plus 2 AC coverage fails (AC-631, AC-815) |
| STORY-76 `story-82eb6908` | REQ-59, REQ-62, REQ-114 (retires) | **incomplete → fail** | In-scope line claims "**capture** of stop positions and surface gradients"; the capture leg has no AC and no test. REQ-72 (the in-browser hexify that makes stops capturable at all) is excluded by the body's own wording. All 5 ACs pass individually |
| STORY-77 `story-16f2793c` | REQ-61, REQ-58 (ladder) | **aligned → fail** | Body matches intent. Fails at 2b: AC-639 and AC-643 both promise the reproduction is rendered/shot at the selected viewport, and neither test lets the command render one |
| STORY-78 `story-2c7069fe` | REQ-61 | **aligned → pass** | All nine ACs drive `run(argv)` at the true CLI boundary via `runCli` (`reconciliation-responsive-diff.test.ts:74-90`), asserting parsed JSON, output ordering, exit codes and persisted files. The model for the other four |
| STORY-79 `story-e15a19ef` | REQ-58, REQ-79, REQ-89, REQ-44 | **aligned → fail** | Body matches intent, incl. guarantee 5 (arrived 2026-08-07 with its five ACs, all substantive). Fails at 2b on AC-657 and AC-720 |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | uat | AC-657 `acceptance_criterion-9c235ff1` (STORY-79) | uat-edit | **The test writes the evidence it then asserts.** AC-657's Criterion is a property of the *command* ("everything written to stdout is exactly one well-formed JSON document") and its Verification says "Run a `values-diff --json` command and capture stdout only". `test_UAT_AC657_json_is_exactly_one_parseable_document` (`tests/reconciliation-1c-cli-output-hygiene.test.ts:53-94`) never invokes `values-diff`: it calls `withCleanStdout` directly, writes three fake diagnostics inside it, then **writes the JSON document itself at `:77`** and parses what it just wrote at `:86`. The production emit — `console.log(JSON.stringify(report, null, 2))` at `tools/generate/src/cli/index.ts:793` — is never executed by any test (`grep "run(\['values-diff"` → no matches). **Failure mode:** add any second `console.log` to the values-diff path and stdout carries two documents, `\| jq` breaks, and this UAT stays green because it never observed the command's stdout. Carried forward unrepaired through two prior passes; file untouched since its generation commit | Rewrite to invoke `run(['values-diff', slug, '--ref', <bundle>, '--actual', <manifest>, '--json'])` and assert the **entire** captured stdout parses as one JSON document equal to the report. Both harness halves exist in-repo: offline `cmdValuesDiff` driving at `…size-aware-diff.test.ts:157`, stdout/exit capture at `…responsive-diff.test.ts:74-90`. Keep the diagnostic-absence assertions |
| 2 | violation | uat | AC-720 `acceptance_criterion-72db61ca` (STORY-79) | uat-edit (or ac-edit) | **The AC advertises evidence that exists only as a one-time manual observation.** AC-720's Criterion bullet 1 and its Verification both close on an end-to-end observable: "a non-empty set of crop pairs is produced" / "End-to-end, `1c aligned-crops <slug> --sandbox` … emits a non-empty set of crop pairs from the sandbox build." `test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve` (`tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:33-75`) asserts only the pure `subRenderOptions` return value, and the file's own docstring concedes the rest: "the commit's end-to-end check — 7 crop pairs from a rendered sandbox reproduction — is **manual**" (`:16-19`). The regression AC-720 exists to prevent is *defined* by crop-pair emptiness, which the seam cannot see — `subRenderOptions` can return a perfectly-shaped object a caller then ignores. Carried forward unrepaired | Either (a) add a browser-gated end-to-end leg asserting a non-empty crop-pair set from a rendered sandbox reproduction — the repo's `it.runIf(browserOk)` idiom (`req62-gradient-panel.test.ts:34`) exists for this; or (b) if genuinely un-automatable, **ac-edit** AC-720 to drop the end-to-end clause. Do not leave the AC asserting a manual check |
| 3 | violation | uat | AC-643 `acceptance_criterion-2ca1d9b9` (STORY-77) | uat-edit | AC-643 has two clauses — "**shoots the reproduction at the selected viewport** *and* compares it against the same-width screenshot" — and its Verification names both. `test_UAT_AC643_pixel_diff_size_pairs_reproduction_against_same_width_reference` (`tests/reconciliation-size-aware-diff.test.ts:212-235`) asserts only the second: it passes `actualImagePath` at `:226`, taking the `if (!actualImage)` branch at `tools/generate/src/cli/perceptual.ts:483` out of play. The unexercised line is `viewport: opts.size` at `perceptual.ts:493` — the sole forwarding of `--size` into `cmdShot`. **Failure mode:** delete `perceptual.ts:493` and every AC in this capability still passes, while `1c diff --size mobile` shoots the reproduction at desktop and diffs it against the 390px reference — a maximal all-red report misattributing a viewport bug to fidelity drift. Carried forward unrepaired | Add a leg driving `cmdDiff` **without** `actualImagePath` — supply `slug` plus a fake `driverFactory` (`MarkerScreenshotDriver` at `…size-aware-diff.test.ts:312` is the ready-made pattern) and assert the driver's `screenshot` received `VIEWPORTS.tablet` |
| 4 | violation | uat | AC-639 `acceptance_criterion-c6534e1a` (STORY-77) | uat-edit | The exact mirror of finding 3, on the values-diff side. AC-639's **title** ("reference from ladder, actual rendered there") and Criterion ("the reference values are those captured at the selected size's width **and the reproduction is rendered at that same viewport**") both name two clauses. `test_UAT_AC639_values_diff_size_compares_at_selected_viewport_width` (`…size-aware-diff.test.ts:109-132`) injects the actual side as a manifest at `:120`, so the second clause is unexercised — the unguarded line is `extractDraftManifest(opts.slug, …, viewport)` at `tools/generate/src/cli/fidelity.ts:167`. The reference-side half is proven precisely (via `expectedSource`, `:124-125`); the reproduction-side half is not proven at all | Add the mirror leg to finding 3's fix: drive `cmdValuesDiff` with a `slug` + fake `driverFactory` and assert the driver was sized to `VIEWPORTS[size]`. Fixing 3 and 4 together closes both size-aware commands' actual-side seam |
| 5 | violation | uat | AC-815 `acceptance_criterion-9ccc1de8` (STORY-75) | uat-edit | **Two defects compounding.** (a) AC-815's Verification names **four** assertions; only two are made. Its two tests (`tests/bug27-nested-backdrop-capture.test.ts:124`, `:137`) cover the collapsed header and the off-canvas block. Unexercised: "an overflow-clipped carousel with off-stage slides … assert the carousel's band is no wider than the document" — the fixture contains **no `overflow` declaration at all**, so the clip-vs-extend clamp (`Math.min(docW, …)` at `tools/generate/src/cli/capture/extract.ts:497-499`, whose own comment names the missing fixture verbatim) never runs; and "assert a conventional band's box is unchanged from its own border box" — asserted nowhere. The one width assertion present (`:143`) is satisfied by the off-canvas case, decided earlier by `onScreenBox` rejection at `extract.ts:483`, so it does not stand in for the `docW` clamp. (b) Both tests use `itA`, which returns silently without Chromium — **in this run both reported 0ms with zero assertions executed**. **Failure mode:** replace `Math.min(docW, acc.x + acc.width)` with `acc.x + acc.width` and both tests still pass, while any site with an `overflow: hidden` carousel captures a band hundreds of px wider than the page — re-opening the class of defect BUG-27 closed | Extend `tests/fixtures/capture/bug27-nested-backdrop.html` with (i) an `overflow: hidden` carousel whose slides extend past its box and (ii) a conventionally laid-out band; assert the carousel band's width is bounded by the document `scrollWidth` and the conventional band's box equals its own border box. Repair jointly with warning 3 |
| 6 | violation | uat | AC-631 `acceptance_criterion-65b5ddd3` (STORY-75) | uat-add | AC-631's Criterion is "the surface colour **captured and compared** … is its effective rendered colour after compositing"; its Verification opens "**Capture** a fixture containing a translucent white card over a tinted band **and diff it**". `test_UAT_AC631_surface_fill_is_composited_alpha_colour` (`tests/reconcile-values-diff-fidelity.test.ts:73-101`) owns only the compare leg and hand-derives the blend at `:86-87`. It cites the capture leg's owner honestly (`:82-84`): `test_UAT_FC_REQ-58_surface_fill_composites_translucent_over_band` (`tests/req58-wrapper-treatments.test.ts:71`) — real and correct, but browser-gated at `:32`, so **where Chromium is absent (including this run) the capture leg has no executing evidence**. The remedy pattern already exists inside this same story: AC-711's capture leg is proven by `tests/reconciliation-capture-list-marker.test.ts:59`, which runs the real `EXTRACT_SCRIPT` under jsdom, environment-independent | Author an AC-711-style UAT for AC-631's capture leg: mount a translucent card over a tinted band, run the real `EXTRACT_SCRIPT` under jsdom, assert the captured `surfaceFill` is the blended tint, not `#ffffff` |
| 7 | violation | story | STORY-75 `story-d5de22a5` | story-body-edit + ac-add | Four reconciled intents whose behaviour is live in this capability's own scope reach no item in the story body, so no AC can be expected and none exists. **BUG-22** split-control surface attribution (`capture/values-diff.ts:137-144`, `:2103-2145`) — an element-pairing rule, CAP-63 Scope bullet 1; item 4 covers only duplicate-*text* pairing. **BUG-24** modern-colour-syntax scrim capture (`extract.ts:1047-1057`, `:1425`) — item 9 *presupposes* it ("scrims already recorded as the band's overlay") without any story stating it is true. **BUG-25** per-text-node run geometry (`extract.ts:666-684`, `:1101-1124`) — item 1 describes the glyph-extent axis but not the multi-run rule. **BUG-16** offline re-extract against mirrored faces (`reextract.ts:45-73`) — and item 7 frames a reference `fontLoaded:false` as an accepted FOUT artifact, which reads as tension with BUG-16 having fixed its dominant cause. Additionally **REQ-73** (`gap` axis, `values-diff.ts:364,406,1406,2533`) and **REQ-76** (cause clustering, `fidelity.ts` + `index.ts:260,759-768`) reach no story anywhere in the matrix | Add closures to STORY-75's Description for split-control surface attribution, band-overlay capture across modern colour syntax, the multi-run geometry condition, and the offline-re-extract mirrored-reference rule (rewording item 7 so residual FOUT is the *remainder*); add the `gap` axis and the cause-clustering view, or home REQ-76 in a story for the values-diff reporting surface. Then author the ACs and UATs |
| 8 | violation | story | STORY-76 `story-82eb6908` | story-body-edit + ac-add | The story's In-scope line declares "**capture** of stop positions and surface gradients", but item 2's *Captured* leg has **no AC and no test** — AC-636 covers Diffed, AC-637 covers Authored, and nothing covers Captured. The only capture-side evidence, `test_UAT_FC_REQ-62_capture_records_panel_gradient_and_solid`, is browser-gated and **skipped in this run**. Separately, **REQ-72** (`free_and_reconciled`, 2026-07-18) requires gradient stop *colours* to be resolved to `#rrggbb` in-browser — without it a Tailwind-authored gradient computes to `oklch`/`oklab` that the TS-side stop regex cannot parse, and the gigabytealchemy card gradient captured as `135° []`, angle-only with empty stops. Live at `extract.ts:331-339` (`hexifyGradient`), applied at `:846` and `:1132`. The story's own wording excludes it, so the precondition that makes stop capture possible at all is unstoried and untested | Extend STORY-76's In-scope line and Description to cover in-browser colour-space resolution of stop colours as the precondition for stop capture; author an AC for item 2's Captured leg with an environment-independent UAT (real `EXTRACT_SCRIPT` under jsdom, per AC-711's pattern) rather than relying solely on the browser-gated leg |
| 9 | warning | uat | AC-658 `acceptance_criterion-7f078026` (STORY-79) | uat-edit | Same shape as finding 1, one degree weaker — hence a warning, and `pass` on coverage. AC-658's Verification says "**Run a `values-diff` command** under conditions that trigger render chatter"; `test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr` (`…cli-output-hygiene.test.ts:100-132`) instead calls `withCleanStdout` with three hand-written diagnostics. It does drive the real production wrapper and substantively proves the stream split — so it is not over-mocked — but nothing proves the CLI still *wraps*: remove the `withCleanStdout(…)` call at `index.ts:780` and this test stays green while every render diagnostic lands on stdout | Fold into finding 1's fix: once the UAT drives `run(['values-diff', …])`, assert the stream split there |
| 10 | warning | uat | AC-815, AC-816 — test harness | uat-edit | The `itA` helper (`tests/bug27-nested-backdrop-capture.test.ts:80-84`) does `if (!capture) return // skip silently` on an unavailable Chromium, so its tests report **PASS with zero assertions**, not SKIP. Confirmed in this run: all six `itA` tests reported 0ms against 1–7ms for their browser-free neighbours. The repo's own idiom elsewhere — `it.runIf(browserOk)` (`req62-gradient-panel.test.ts:34`, `req58-wrapper-treatments.test.ts:32`) — marks the test skipped, which is *visible* in the run report. AC-816 is graded `pass` because four browser-free `foldToL1` tests (`:213-244`) execute unconditionally; AC-815 has no such backstop, which is why it is finding 5 | Switch `itA` to `it.runIf(browserOk)` so an absent browser shows as a skip. Repair together with finding 5 |
| 11 | warning | ac | AC-637 `acceptance_criterion-377af866`, AC-638 `acceptance_criterion-a657c39c` (STORY-76) | ac-edit | Both AC **bodies** carry the palette-role stop alias **REQ-114** retired (`free_and_reconciled`, 2026-07-31). AC-637's Verification prescribes asserting `var(--color-<role>)`, which cannot pass against live code — `resolveColor` is literal-only (`packages/framework/src/modules/text-style.ts:165-167`) and `gradientImage` drops the whole gradient on a non-literal stop (`:195-207`). AC-638 says the field "**accepts** … an absolute hex **or a palette-role alias**"; `validateGradient` now **rejects** a role alias (`packages/framework/src/modules/validate.ts:130-134`, `:101-107`). Both **tests are right and both ACs are stale** — `tests/req62-gradient-panel.test.ts:75-82` even carries the comment "REQ-114 — the literal-or-alias stop is now literal-only". Graded `pass` on coverage (the tests substantively drive the real `resolveSurfaceGradient` / `validateModuleContent` and assert current behaviour); this is not a coverage gap. AC-637's title additionally names `text-block`, a module REQ-79/84 deleted. Already filed as violations 1–3 of `report-cb7ea283` (ac level, open) | No uat-level action. Resolve at ac level; repairing the ACs will make the tests match. Do **not** deprecate — the resolver and validator behaviours are live reconciled REQ-62 intent |
| 12 | warning | story | CAP-63 body + all five story bodies | story-body-edit | Two naming/scope drifts, neither a coverage gap. (a) CAP-63's Scope bullet 4 covers only boolean-flag parsing and `--json`/stderr hygiene, but STORY-79 additionally carries guarantee 3 (store-selecting flags propagate into sub-commands), guarantee 4 (on-demand Astro container, REQ-89) and guarantee 5 (dependency preflight, REQ-44, landed 2026-08-07 after the body's last edit) — none of which is "argument parsing" or "output hygiene", and guarantee 4 touches the render path the body's Out-of-scope pushes away. (b) All five stories still name the pre-consolidation capability structure retired 2026-08-05: STORY-78 "Belongs to CAP-65", STORY-79 "Related capabilities: CAP-63 (1c Values-Diff Fidelity), CAP-65", STORY-77 "Generalizes CAP-63", STORY-76 "Sits alongside [[values_diff_fidelity]] (CAP-63)", STORY-75 "1c Values-Diff Fidelity" — CAP-64/65/66 are deprecated and several are same-capability self-references under the old name | Widen Scope bullet 4 to name flag propagation into sub-commands, the on-demand Astro container and the dependency preflight; update all five stories to "1c Capture & Diff Fidelity" (CAP-63) and replace cross-capability references with intra-capability ones |

## Notes for the Editor

**One cross-cutting pattern accounts for findings 1, 3, 4 and 9 — fix them as one
batch.** Four ACs state a property of a *command* but are tested at an internal
seam one layer below it: AC-657/658 stop at `withCleanStdout` instead of
`run(['values-diff', …])`; AC-643/639 inject a pre-made actual side instead of
letting the command render one. In each case the line that actually implements
the AC (`index.ts:780`/`:793`, `perceptual.ts:493`, `fidelity.ts:167`) can be
deleted with the whole capability still green. All four are fixable with
harnesses that already exist in this repo — `runCli` at
`…responsive-diff.test.ts:74-90` and the fake-`driverFactory` pattern at
`…size-aware-diff.test.ts:312`. One batch clears three violations and one warning.

**Findings 5 and 10 both land on AC-815 and must be repaired together.** The
fixture needs new elements *and* the harness must stop passing silently. Repairing
only the assertions leaves them potentially never executed — which is the state
they are in right now.

**Browser-gated evidence is this capability's structural blind spot.** Three
separate findings (5, 6, 8) reduce to the same root: the capture-side leg of an
AC is proven only by a Chromium test, and Chromium is absent here. Where the
repo has already solved this — AC-711's `tests/reconciliation-capture-list-marker.test.ts:59`,
which runs the real `EXTRACT_SCRIPT` under jsdom — the evidence is
environment-independent and executes every run. That pattern should be the
default for any capture-side AC, with the browser leg as reinforcement rather
than sole evidence.

**Findings 7 and 8 are the only ones needing new ACs, and they share a cause.**
BUNDLE-10 (`bundle-4ff83a8b`, `free_and_reconciled`) appears as `intent_uid` or
`updated_by` on **zero stories anywhere in the matrix**; BUG-22, BUG-24, BUG-25
and BUG-16 are all its members. BUG-15/25/27 were later re-carried by BUNDLE-11,
which *is* on STORY-75's `updated_by` — which is exactly why BUG-27 is covered and
BUG-22/BUG-24 are not. Separately REQ-72, REQ-73 and REQ-76 (all reconciled
2026-07-18) are named in no bundle body at all. Repairing STORY-75 is the bulk of
the work; it is worth re-walking BUNDLE-10's remaining members against CAP-70 and
CAP-71 too, since the same hole plausibly cost them coverage.

**Findings 1, 2, 3 and 4 have now survived three consecutive passes untouched** —
all four test files still sit at their original generation commit. If the fix loop
is not reaching these files, that is worth investigating before a fourth pass
files them again.

**STORY-78 is the model.** Nine ACs, every one driven through `run(argv)` at the
true CLI boundary, asserting parsed JSON, human output ordering, exit codes and
persisted files, with the terminal-fail paths proven to emit no partial table. It
is the only story in this capability with no finding against it at any level.
