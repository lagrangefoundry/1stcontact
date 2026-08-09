---
uid: report-0cedc206
id: REPORT-1723
type: report
title: 'Capability-Intent Alignment: 1c_capture_diff_fidelity (level=uat)'
created_by: xgd
created_at: '2026-08-09T02:23:54.253650+00:00'
updated_at: '2026-08-09T02:23:54.253650+00:00'
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

# Capability-Intent Alignment: 1c_capture_diff_fidelity
# Level: uat

**Result**: FAIL
**Violations**: 4
**Warnings**: 4
**Needs review**: 0

Scope: the 48 ACs across the five stories of `capability-aa030c83` (CAP-63) —
STORY-75 (14), STORY-76 (5), STORY-77 (8), STORY-78 (9), STORY-79 (12). The AC
set is unchanged since the last uat pass (`report-f8f844e2`, 2026-08-07): same
48 UIDs, all `UPDATE:2026-08-07`.

**Coverage remains structurally complete.** Every AC has at least one
`test_UAT_AC<n>_*` test; no AC is testless. **Exclusivity is clean** — the six
multi-test ACs (AC-711 ×2, AC-815 ×2, AC-816 ×8, AC-817 ×3, AC-1013 ×2,
AC-1016 ×2) each split by test *shape* or scenario, not by repetition; AC-816's
eight and AC-817's three were re-listed by name this pass and no two cover the
same scenario. Every finding below is about **depth of evidence**, not absence
of it.

**This is the third consecutive uat pass to file findings 1–3 and the second to
file findings 4/8, and nothing has been repaired.** Verified mechanically, not
assumed: the three carried-forward test files are still at their original
`reconciliation_uat_generation_prompt` commits —
`reconciliation-1c-cli-output-hygiene.test.ts` (3d20958cd, 2026-07-18),
`reconciliation-size-aware-diff.test.ts` (badb26c0d, 2026-07-18),
`reconciliation-1c-aligned-crops-sandbox-routing.test.ts` (087e14526,
2026-07-22). `bug27-nested-backdrop-capture.test.ts` and its fixture last moved
2026-08-05 (164dc05ab), before the report that flagged them. Each finding was
re-derived this pass against the current AC body and the current test source —
none is copied forward on trust.

Per the level cascade, **AC bodies are the working reference**. Every quoted
Criterion/Verification string below was read from the live AC ticket this pass.
Intent was consulted in one place only — AC-637, where the AC body is itself
stale (finding 9).

## Cumulative Intent Considered

Carried from the ledger established at story level and narrowed at ac level.
Nothing at uat level required re-deriving the chronology.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` (REQ-58, REQ-59, REQ-61, REQ-62) | free_and_reconciled | 2026-07-17 | `intent_uid` of all five stories; `--size` + `responsive-diff` (→ STORY-77/78); gradient stops + panel gradient (→ STORY-76) | YES |
| BUNDLE-7 `bundle-31e474b9` (REQ-63, REQ-79, REQ-82/83/84) | free_and_reconciled | 2026-07-22 | Typography/effect axes (→ AC-711…714); aligned-crops sandbox routing (→ AC-720) | YES |
| BUNDLE-8 `bundle-cceaba25` (REQ-89, BUG-10) | free_and_reconciled | 2026-07-29 | Quiet bootstrap + on-demand Astro container (→ AC-738/739); painted-marker precondition (→ AC-711) | YES |
| **REQ-114** `request-3cd338cd` | **free_and_reconciled** | 2026-07-31 | **L1 palette colour model: literal base, palette overlay. Retired the palette-role alias — the ground for finding 9** | YES (retires) |
| BUNDLE-11 `bundle-ee56a66e` (BUG-27) | free_and_reconciled | 2026-08-05 | Backdrop / collapsed-subtree capture ask (→ AC-815/816/817) | YES |
| BUNDLE-16 `bundle-15c1f647` (REQ-44) | free_and_reconciled | 2026-08-07 | Per-command dependency preflight (→ AC-1013…AC-1017) | YES |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| **STORY-75** `story-d5de22a5` — 14 ACs | REQ-58, REQ-63, BUG-10, BUG-27 | **1 violation, 2 warnings.** AC-629/630/632/633 drive the real `diffManifests`; AC-711…715 likewise, AC-711 additionally proven capture-side under jsdom; AC-816 (8 tests: real-Chromium capture + pure `foldToL1`) and AC-817 (3 × `diffManifests`) are exemplary; AC-818 drives the real `extractFields`. **AC-815 is the outlier** (findings 4 + 8); **AC-631** owns only the compare leg (finding 7) |
| **STORY-76** `story-82eb6908` — 5 ACs | REQ-59, REQ-62, REQ-114 (retires) | **aligned at uat level.** AC-634/635/636/638 drive the real `diffManifests` / `validateModuleContent`; stop-position, positionless-stop, present-vs-missing and malformed-value legs all land. AC-637's test diverges from its Verification, but the **AC** is stale — finding 9, an ac-level repair |
| **STORY-77** `story-16f2793c` — 8 ACs | REQ-61, REQ-58 (ladder) | **1 violation, 1 warning.** AC-640/641/642/644/645/647 drive `cmdValuesDiff` / `cmdDiff` / `cmdCapturePage` / `run(argv)` for real, including both fail-loud paths and the no-image-bytes matrix check. **AC-643 (finding 2) and AC-639 (finding 6) share one blind spot** — both inject a pre-made actual side, so neither command's `--size`→actual-render forwarding ever executes |
| **STORY-78** `story-2c7069fe` — 9 ACs | REQ-61 | **aligned — the strongest story in the capability.** All nine ACs drive `run(argv)` at the true CLI boundary via the `runCli` harness (`reconciliation-responsive-diff.test.ts:74-90`), asserting parsed JSON, human output ordering, exit codes and persisted files |
| **STORY-79** `story-e15a19ef` — 12 ACs | REQ-58, REQ-79, REQ-89, REQ-44 | **2 violations, 1 warning.** AC-738 spawns the real `1c` binary as a subprocess; AC-739 spies real container construction; AC-1013…1017 pair `assertInstall` legs with real-binary subprocess legs; AC-656 is genuinely a `parseArgs` property and correctly tested there. **AC-657 (finding 1), AC-720 (finding 3) and AC-658 (finding 5) are the gaps** |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-657 `acceptance_criterion-9c235ff1` (STORY-79) | uat-edit | **Third consecutive pass unrepaired**; file at 3d20958cd (2026-07-18). AC-657's Criterion is a property of *the command* — "When a `values-diff` command … is run with `--json`, everything written to stdout is exactly one well-formed JSON document" — and its Verification opens "**Run a `values-diff --json` command** and capture stdout only". `test_UAT_AC657_json_is_exactly_one_parseable_document` (`tests/reconciliation-1c-cli-output-hygiene.test.ts:53-94`) never invokes the command: it calls `withCleanStdout` directly, writes three fake diagnostics inside it, then **writes the JSON document itself** (`:77`) and parses what it just wrote (`:86`). Its own docstring concedes this — "Faithful reproduction of run()'s `--json` path". Re-verified this pass: no test in `tests/` drives `run(['values-diff', …])` (grep for `run(['values-diff` and for `values-diff` near `run(`/`argv`/`spawn` → zero matches). The real path is `tools/generate/src/cli/index.ts:779-793` — `withCleanStdout(() => cmdValuesDiff({…}))` at `:780`, `console.log(JSON.stringify(report, null, 2))` at `:793`, both confirmed present this pass. **Failure mode:** add any second `console.log` to the `case 'values-diff'` block — a summary line, a stray `formatReport` — and stdout carries two documents, `\| jq` breaks, AC-657 is violated in production, and this UAT stays green because it never observed the command's stdout | Rewrite to invoke `run(['values-diff', slug, '--ref', <bundle>, '--actual', <manifest>, '--json'])` and assert the **entire** captured stdout parses as one JSON document equal to the report. Both harness halves already exist in-repo: offline `cmdValuesDiff` driving at `…size-aware-diff.test.ts:157`, and stdout/exit-code capture at `…responsive-diff.test.ts:74-90`. Keep the diagnostic-absence assertions |
| 2 | violation | consistency | AC-643 `acceptance_criterion-2ca1d9b9` (STORY-77) | uat-edit | **Third consecutive pass unrepaired**; file at badb26c0d (2026-07-18). AC-643's Criterion has two clauses — "**shoots the reproduction at the selected viewport** *and* compares it against the reference bundle's same-width screenshot" — and its Verification names both: "assert **the reproduction is rendered/shot at the tablet viewport** *and* the reference image used is the tablet-width one". `test_UAT_AC643_pixel_diff_size_pairs_reproduction_against_same_width_reference` (`tests/reconciliation-size-aware-diff.test.ts:212-235`) asserts only the second: it passes `actualImagePath` (`:226`), which takes the `if (!actualImage)` branch at `tools/generate/src/cli/perceptual.ts:483` out of play entirely. The unexercised line is `viewport: opts.size` at `perceptual.ts:493` — the sole forwarding of `--size` into the reproduction shot; both line numbers re-confirmed this pass. **Failure mode:** delete `perceptual.ts:493` and every AC in this capability still passes, while `1c diff --size mobile` shoots the reproduction at desktop and diffs it against the 390px reference — a maximal all-red pixel report that misattributes a viewport bug to fidelity drift | Add a leg driving `cmdDiff` **without** `actualImagePath` — supply `slug` plus a fake `driverFactory` (the `MarkerScreenshotDriver` at `…size-aware-diff.test.ts:312` is the ready-made pattern, as is `tests/shot.test.ts:133`) and assert the driver's `screenshot` received `VIEWPORTS.tablet` |
| 3 | violation | coverage | AC-720 `acceptance_criterion-72db61ca` (STORY-79) | uat-edit (or ac-edit) | **Third consecutive pass unrepaired**; file at 087e14526 (2026-07-22). AC-720's Criterion bullet 1 and its Verification both close on an **end-to-end** observable: "the drift-aligned ref/ours crop pairs are emitted from that sandbox reproduction (for a real sandbox reproduction with matching anchors, a non-empty set of crop pairs is produced)" / "End-to-end, `1c aligned-crops <slug> --sandbox` … emits a non-empty set of crop pairs from the sandbox build." `test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve` (`tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:33-75`) covers only the pure `subRenderOptions` seam, and the file's docstring still states the rest is not automated: "the browser + sharp crop pipeline downstream of it is the orchestrator (the commit's end-to-end check — 7 crop pairs from a rendered sandbox reproduction — is **manual**)" (`:16-19`). The matrix therefore advertises evidence that exists only as a one-time manual observation. This matters more than ordinary options-plumbing because the regression AC-720 exists to prevent — "`--sandbox` was ignored by the render/serve step … so that no valid crops could be produced" — is *defined* by crop-pair emptiness, which the seam test cannot see: `subRenderOptions` can return a perfectly-shaped object that a caller then ignores | Either (a) add a browser-gated end-to-end leg asserting a non-empty crop-pair set from a rendered sandbox reproduction — the repo's `it.runIf(browserOk)` idiom (`tests/req58-wrapper-treatments.test.ts:32`) exists for exactly this; or (b) if judged genuinely un-automatable, **ac-edit** AC-720 to drop the end-to-end clause from Criterion and Verification. Do not leave the AC asserting a manual check |
| 4 | violation | coverage | AC-815 `acceptance_criterion-9ccc1de8` (STORY-75) | uat-edit | **Second consecutive pass unrepaired**; test + fixture last touched 164dc05ab (2026-08-05), before the report that first flagged this. AC-815's Verification names **four** assertions; only two are made. Its two tests are `test_UAT_AC815_collapsed_header_subtree_is_captured` and `test_UAT_AC815_offscreen_block_does_not_become_or_inflate_a_band` (`tests/bug27-nested-backdrop-capture.test.ts:124`, `:137`), both driving the real `cmdCapturePage` against `tests/fixtures/capture/bug27-nested-backdrop.html`. Covered: the collapsed header and the off-canvas block. **Unexercised (a):** "an overflow-clipped carousel with off-stage slides … assert the carousel's band is no wider than the document". Re-verified this pass: `grep -n overflow tests/fixtures/capture/bug27-nested-backdrop.html` returns **zero matches** — the fixture contains no `overflow` declaration at all, so the clip-vs-extend clamp the Criterion makes load-bearing in both directions ("Overflow that genuinely extends the document grows the canvas and is kept; overflow that is clipped does not and is cut") never runs. That clamp is `var x1 = Math.min(docW, acc.x + acc.width), y1 = Math.min(docH, acc.y + acc.height)` at `tools/generate/src/cli/capture/extract.ts:499`, whose own comment at `:494` names the missing fixture verbatim ("off-stage slides under overflow:hidden"). The one width assertion present (`:143`, `s.box.width <= cap.viewport.width + 1`) is satisfied by the off-canvas case, which is decided earlier and by a different mechanism — `onScreenBox` rejection at `extract.ts:484` — so it does not stand in for the `docW` clamp. **Unexercised (b):** "assert a conventional band's box is unchanged from its own border box" — asserted nowhere; the code comment at `extract.ts:472` claims exactly this property ("leaves a conventionally-laid-out band unchanged") with no test behind it. **Failure mode:** replace `Math.min(docW, acc.x + acc.width)` with `acc.x + acc.width` and both AC-815 tests still pass, while any site with an `overflow: hidden` carousel captures a band hundreds of px wider than the page — re-opening precisely the class of defect BUG-27 closed | Extend `bug27-nested-backdrop.html` with (i) an `overflow: hidden` carousel whose slides extend well past its box, and (ii) a conventionally laid-out band. Add assertions that the carousel's band width is bounded by the document's `scrollWidth` (not merely the viewport), and that the conventional band's captured box equals its own border box |
| 5 | warning | consistency | AC-658 `acceptance_criterion-7f078026` (STORY-79) | uat-edit | Same shape as finding 1, one degree weaker; unrepaired. AC-658's Verification says "**Run a `values-diff` command** under conditions that trigger render chatter and capture stdout and stderr separately"; `test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr` (`tests/reconciliation-1c-cli-output-hygiene.test.ts:100-132`) instead calls `withCleanStdout` with three hand-written diagnostics and checks the stream split. Weaker because the AC's load-bearing mechanism genuinely *is* the wrapper (the AC names it), the test file declares its boundary honestly at `:13-19`, and the AC's other clause — bootstrap quiet *at source* — is cross-referenced to AC-738, which does spawn the real binary. But nothing proves the CLI still *wraps* the values-diff compute: remove the `withCleanStdout(…)` call at `index.ts:780` and this test stays green while every render diagnostic lands on stdout | Fold into finding 1's fix: once the UAT drives `run(['values-diff', …])`, assert the stream split there |
| 6 | warning | consistency | AC-639 `acceptance_criterion-c6534e1a` (STORY-77) | uat-edit | Unrepaired — `…size-aware-diff.test.ts:118` still supplies `actualManifestPath`. AC-639's Criterion states "the reference values are those captured at the selected size's width **and the reproduction is rendered at that same viewport**". `test_UAT_AC639_values_diff_size_compares_at_selected_viewport_width` (`:109-132`) injects the actual side as a manifest, so the second clause is unexercised — the unguarded line is `extractDraftManifest(opts.slug, opts.source ?? 'draft', factory, opts, viewport)` at `tools/generate/src/cli/fidelity.ts:167` (re-confirmed this pass), the values-diff twin of finding 2's `perceptual.ts:493`. Filed as a warning rather than a violation because AC-639's *Verification* asks only to confirm the reference values come from the ladder at the selected width — which the test does precisely, via `expectedSource` (`:124-125`). The gap is between Criterion and Verification, not between Verification and test | Add the mirror leg to finding 2's fix: drive `cmdValuesDiff` with a `slug` + fake `driverFactory` and assert the driver was sized to `VIEWPORTS[size]`. Fixing 2 and 6 together closes both size-aware commands' actual-side seam |
| 7 | warning | coverage | AC-631 `acceptance_criterion-65b5ddd3` (STORY-75) | uat-add | Unrepaired — `reconcile-values-diff-fidelity.test.ts:86-87` still hand-derives the blend from the compositing formula. AC-631's Criterion is "the surface colour **captured and compared** … is its effective rendered colour after compositing", and its Verification opens "**Capture** a fixture containing a translucent white card over a tinted band **and diff it**". `test_UAT_AC631_surface_fill_is_composited_alpha_colour` (`:73-101`) owns only the compare leg, and cites the capture leg's owner honestly (`:82-84`): `test_UAT_FC_REQ-58_surface_fill_composites_translucent_over_band` (`tests/req58-wrapper-treatments.test.ts:71`). That sibling is real and correct but **browser-gated** — `const itB = it.runIf(browserOk)` at `:32`, confirmed this pass — so where Chromium is absent the capture leg has no executing evidence. The remedy pattern exists inside this same story: AC-711's capture leg is proven by `test_UAT_AC711_list_marker_recorded_only_where_a_marker_is_painted` (`tests/reconciliation-capture-list-marker.test.ts:59`), which runs the real `EXTRACT_SCRIPT` under jsdom, environment-independent | Author an AC-711-style UAT for AC-631's capture leg: mount a translucent card over a tinted band, run the real `EXTRACT_SCRIPT` under jsdom, assert the captured `surfaceFill` is the blended tint, not `#ffffff` |
| 8 | warning | consistency | AC-815 `acceptance_criterion-9ccc1de8` (STORY-75) — test harness | uat-edit | Unrepaired. AC-815's only two tests use the local `itA` helper (`tests/bug27-nested-backdrop-capture.test.ts:79-84`), which on an unavailable Chromium does `if (!capture) return // Chromium unavailable — skip silently` — the test reports **PASS with zero assertions executed**, rather than SKIP. AC-815 is the only AC in this capability whose *entire* evidence is browser-gated this way (AC-816 uses the same helper but is backed by four browser-free `foldToL1` tests at `:213-244`; AC-817's three need no browser). The repo's own idiom elsewhere — `it.runIf(browserOk)` (`req58-wrapper-treatments.test.ts:32`) — marks the test *skipped*, which is visible in the run report; the silent return is not. Distinct from finding 4: that one is about missing assertions, this one is about green evidence that may never have run | Switch `itA` to `it.runIf(browserOk)` so an absent browser shows as a skip, and/or add a browser-free leg for AC-815's clamp arithmetic in the shape of AC-816's `foldToL1` tests |
| 9 | info | — | AC-637 `acceptance_criterion-377af866` (STORY-76) | — | Re-checked this pass: AC-637's Verification **still** demands a palette-role stop resolving to `var(--color-<role>)`. `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` (`tests/req62-gradient-panel.test.ts:69-88`) drives the real `resolveSurfaceGradient` and passes, deliberately using two hex literals, its comment citing REQ-114 (`request-3cd338cd`, free_and_reconciled, 2026-07-31), which retired the palette-role alias. **The test is right and the AC is stale.** No uat-level action — this is an ac-level repair, and repairing the AC will make the test match | none — resolve at ac level |
| 10 | info | — | AC-711, AC-815, AC-816, AC-817, AC-1013, AC-1016 | — | Exclusivity re-checked across all six multi-test ACs by enumerating distinct test names. None redundant: AC-711 splits diff-side (`diffManifests`) from capture-side (real `EXTRACT_SCRIPT` under jsdom); AC-816's eight split real-Chromium capture (nested backdrop, fill-beneath-image, panel-vs-card, scrim-not-indexed) from pure `foldToL1` (emit, paint order, band bounding, fill+veil); AC-817's three are distinct scenarios (mirrored match, missing image, wrong asset); AC-1013's and AC-1016's two each split in-process `run()` from a real-binary subprocess under a module-resolution hook. Different test *shapes* and distinct scenarios — complementary, not duplicates | none |

## Notes for the Editor

**One cross-cutting pattern accounts for findings 1, 2, 5 and 6.** Four ACs state
a property of a *command* but are tested at an internal seam one layer below it:
AC-657/658 stop at `withCleanStdout` instead of `run(['values-diff', …])`;
AC-643/639 inject a pre-made actual side instead of letting the command render
one. In each case the line that actually implements the AC (`index.ts:780`/`:793`,
`perceptual.ts:493`, `fidelity.ts:167`) can be deleted with the whole capability
still green. All four are fixable with harnesses that already exist in this repo —
`runCli` at `…responsive-diff.test.ts:74-90` and the fake-`driverFactory` pattern
at `…size-aware-diff.test.ts:312`. Fixing them as one batch clears two violations
and two warnings.

**Findings 4 and 8 both land on AC-815 and must be repaired together** — the
fixture needs new elements (the overflow-clipped carousel, the conventional band)
*and* the harness needs to stop passing silently when the browser is absent.
Repairing only the assertions leaves them potentially never executed.

**Escalation: the fix loop is not reaching these files.** This is the sixth
attempt at this level. Findings 1–3 have now been filed by three consecutive
uat-level reports (`report-a85d40c2` 2026-08-05, `report-f8f844e2` 2026-08-07,
this one) with the underlying files provably untouched across all three — still
at their July `reconciliation_uat_generation_prompt` commits. Findings 4/8 have
survived two. Re-filing them a fourth time is unlikely to change the outcome on
its own; whatever is preventing the downstream editor from acting on
`uat-edit`/`uat-add` categories for these three files is worth diagnosing before
the next cycle, otherwise this level cannot converge.

**Environment note (not a finding).** This cycle's upstream reports — REPORT-1721
(story) and REPORT-1722 (ac) — appear in the ticket index but their bodies are
not resolvable from this worktree: `xgd ticket get` returns "not found", and a
retry after the CLI moved 0.15.143→0.15.145 timed out on
`index_fcntl_lock: timed out after 30000ms waiting for exclusive lock on
.xgd/_locks/__cold_index__.flock` (contention with a concurrent workflow
process). Their verdicts could therefore not be read here. This did not affect
the uat-level analysis: at this level AC bodies are the working reference, and
every AC quoted above was read live from its own ticket this pass. But a
downstream editor should sequence story → ac → uat, and should confirm whether
those two upstream reports are still open — finding 9 in particular is an
ac-level repair this level cannot make.
