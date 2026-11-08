---
uid: report-a85d40c2
id: REPORT-1328
type: report
title: 'Capability-Intent Alignment: 1c_capture_diff_fidelity (level=uat)'
created_by: xgd
created_at: '2026-08-05T23:07:04.396019+00:00'
updated_at: '2026-08-05T23:07:04.396019+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: uat
  violations: 3
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c_capture_diff_fidelity
# Level: uat

**Result**: FAIL
**Violations**: 3
**Warnings**: 3
**Needs review**: 0

Scope: the 37 distinct active ACs across the five stories of `capability-aa030c83`
(CAP-63) after the 2026-08-05 structural rebalance. Every one of the 37 carries a
`test_UAT_AC<n>_*` test — **coverage at this level is complete**, with no AC left
unevidenced and no two tests redundant. All 37 execute and pass (verified this
cycle: `vitest run` over the eight AC-bearing files → 8 files / 37 tests passed;
`req62-gradient-panel` + `astro-free-render` → 8 passed, 2 skipped, both skips
being browser-gated `test_UAT_FC_*` siblings, not AC UATs).

All three violations are the same shape — **consistency, not coverage**: a
substantive test exists and passes, but it exercises a *seam beneath* the command
its AC names, leaving a clause the AC's own Verification section explicitly
demands unasserted. In each case the unexercised clause is a live production line
of code, and a regression there would leave the UAT green. That is precisely the
failure mode this capability exists to prevent ("0 value-diffs ⟺ pixel-faithful"),
turned on the gate itself.

Per the level cascade, **AC bodies are the working reference**; intent was not
re-derived. Note carried forward, not re-litigated: the two AC-level violations in
`report-728bd245` (REPORT-1327, same cycle) are **still unrepaired** — AC-637 is
still titled for the deleted `text-block` module (`acceptance_criterion-377af866`,
`updated_at` 2026-07-24) and STORY-76 still has no AC for the surface-gradient
*capture* leg. Those remain AC-level work; finding 6 below is the uat-level
shadow of the same pattern.

## Cumulative Intent Considered

Condensed from the ledger established at story level (`report-88eb3839` /
REPORT-1326) and narrowed at ac level (`report-728bd245`). Nothing at uat level
required re-deriving the chronology.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` (REQ-58 + REQ-59 + REQ-62 + REQ-61) | free_and_reconciled | 2026-07-17, main `7a42e182` | `intent_uid` of all five stories. REQ-58 intrinsic axes + ladder; REQ-59 gradient stop positions; REQ-62 panel/surface gradient; REQ-61 `--size` + `responsive-diff` | YES |
| BUNDLE-7 `bundle-31e474b9` (REQ-63 + REQ-79 + REQ-82/83/84 + 2) | free_and_reconciled | 2026-07-22, main `edeb1c2c` | REQ-63 coverage audit → the typography/effect/media axes (AC-711…715); REQ-79/84 framework pivot retired the semantic layout modules | YES |
| BUNDLE-8 `bundle-cceaba25` (BUG-7 + REQ-89…92 + 5) | free_and_reconciled | 2026-07-29, main `b1bd5b6b` | `updated_by` of STORY-75 and STORY-79 — the CLI hygiene / quiet-bootstrap / astro-free-render additions (AC-720, AC-738, AC-739) | YES |

## Alignment Ledger

One row per AC-named test. "aligned" = the test exercises the behaviour its AC
Criterion and Verification describe, at a boundary that would catch a regression
in the named production code.

| Element (test → AC) | Intents aligned to | Outcome |
|---|---|---|
| `test_UAT_AC629/630` `reconcile-values-diff-fidelity.test.ts:38,52` | REQ-58 (T1) | aligned — drives real `diffManifests`; ratio tolerance, one-sided skip, `--tolerant` band all asserted |
| `test_UAT_AC631` `…fidelity.test.ts:73` | REQ-58 | **partial** — compare leg aligned; capture leg delegated to a browser-gated sibling (finding 6) |
| `test_UAT_AC632/633` `…fidelity.test.ts:103,125` | REQ-58 | aligned — all three border cases; reversed-order duplicate pairing incl. the genuine-delta and single-occurrence legs |
| `test_UAT_AC711` (compare) `reconcile-values-diff-treatments.test.ts:64` + `test_UAT_AC711` (capture) `reconciliation-capture-list-marker.test.ts:59` | REQ-63 | aligned — **two complementary legs, not duplicates**: the first diffs the five treatment axes, the second runs the real `EXTRACT_SCRIPT` under jsdom for the painted-marker precondition. Exclusivity clear |
| `test_UAT_AC712/713/714/715` `…treatments.test.ts:98,131,162,183` | REQ-63 | aligned — each axis's differ / match / absent-one-side legs asserted, severities pinned |
| `test_UAT_AC634/635/636/638` `reconcile-gradient-first-class.test.ts:62,77,108,138` | REQ-59, REQ-62 | aligned — stop-position drift, positionless-stop fallback (both-null *and* one-null), surface-gradient tri-state, real `validateModuleContent` |
| `test_UAT_AC637` `req62-gradient-panel.test.ts:69` | REQ-62 | aligned **to the AC body** (`resolveSurfaceGradient`), not to the AC's stale title (finding 7 — carried from ac level) |
| `test_UAT_AC639` `reconciliation-size-aware-diff.test.ts:109` | REQ-61 | **partial** — reference-from-ladder leg aligned; actual-rendered-at-viewport leg unexercised (finding 5) |
| `test_UAT_AC640/641/642/645/647` `…size-aware-diff.test.ts:138,179,196,263,333` | REQ-61 | aligned — default path on both commands, both fail-loud messages, `run(argv)` vocabulary rejection, capture-persists-per-width with a marker driver proving no image bytes in the matrix |
| `test_UAT_AC643` `…size-aware-diff.test.ts:212` | REQ-61 | **gap** — same-width reference selection aligned; shot-at-viewport leg unexercised (finding 2) |
| `test_UAT_AC644` `…size-aware-diff.test.ts:241` | REQ-61 | aligned |
| `test_UAT_AC648…655, AC721` `reconciliation-responsive-diff.test.ts:95…365` | REQ-61 | aligned — driven at the CLI boundary via `run(argv)` with stdout/stderr/exit-code capture; every clause incl. grouping order, "holds steady", and `--out` byte-identity under `--classify` |
| `test_UAT_AC656` `reconciliation-1c-cli-output-hygiene.test.ts:25` | BUNDLE-8 | aligned — AC Verification names the parsing boundary; test drives real `parseArgs`, both orderings |
| `test_UAT_AC657` `…output-hygiene.test.ts:53` | BUNDLE-8 | **gap** — never runs `values-diff`; simulates `run()`'s `--json` path (finding 1) |
| `test_UAT_AC658` `…output-hygiene.test.ts:100` | BUNDLE-8 | **partial** — wrapper aligned; command-level leg unexercised (finding 4) |
| `test_UAT_AC659` `…output-hygiene.test.ts:138` | BUNDLE-8 | aligned — AC Verification names the wrapper explicitly; both success and throw paths asserted on the raw byte channel |
| `test_UAT_AC720` `reconciliation-1c-aligned-crops-sandbox-routing.test.ts:33` | BUNDLE-8 | **gap** — options seam aligned; the AC's end-to-end clause is declared manual (finding 3) |
| `test_UAT_AC738/739` `reconciliation-1c-astro-free-render.test.ts:95,132` | BUNDLE-8 | aligned — AC-738 spawns the real `1c.mjs` as a subprocess and checks both streams + exit code; AC-739 spies `experimental_AstroContainer.create` across all three site shapes |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-657 `acceptance_criterion-9c235ff1` (STORY-79 `story-e15a19ef`) | uat-edit | AC-657's whole claim is a property of **the command**: "everything written to stdout is exactly one well-formed JSON document", and its Verification says "**Run a `values-diff --json` command** and capture stdout only". `test_UAT_AC657_json_is_exactly_one_parseable_document` (`tests/reconciliation-1c-cli-output-hygiene.test.ts:53-94`) never invokes `values-diff`. It calls `withCleanStdout` directly, writes three fake diagnostics inside it, then **writes the JSON document itself** (`:77`) and parses what it just wrote (`:86`). Its own docstring concedes the framing: "Faithful reproduction of run()'s `--json` path". The real path is `tools/generate/src/cli/index.ts:491-506` — the compute wrapped at `:491`, `console.log(JSON.stringify(report, null, 2))` at `:504`. **No test anywhere invokes `run(['values-diff', …, '--json'])`** (grep: `run(['values-diff` → no matches; only AC-645 reaches `run()` with `values-diff`, and it throws on vocabulary validation before the emit). **Failure mode:** add any second `console.log` to the `values-diff` case — a summary line, a deprecation note, a stray `formatReport` — and stdout carries two documents, `\| jq` breaks, and AC-657 is violated in production while this UAT stays green, because it never observed the command's stdout. Offline feasibility is already demonstrated in-repo: AC-640 (`reconciliation-size-aware-diff.test.ts:138`) drives `cmdValuesDiff` against a bundle + `--actual` manifest with no browser, and AC-655 (`reconciliation-responsive-diff.test.ts:74-90`) shows the stdout/exit-code capture harness | Rewrite the UAT to invoke `run(['values-diff', slug, '--ref', <bundle>, '--actual', <manifest>, '--json'])` with `process.stdout.write` captured at the byte level (the harness at `…output-hygiene.test.ts:62-67` already does this), then assert the **entire** captured stdout parses as one JSON document equal to the report. Keep the diagnostic-absence assertions |
| 2 | violation | consistency | AC-643 `acceptance_criterion-2ca1d9b9` (STORY-77 `story-16f2793c`) | uat-edit | AC-643 has two clauses — "**shoots the reproduction at the selected viewport** *and* compares it against the reference bundle's same-width screenshot" — and its Verification names both: "assert **the reproduction is rendered/shot at the tablet viewport** *and* the reference image used is the tablet-width one". `test_UAT_AC643_pixel_diff_size_pairs_reproduction_against_same_width_reference` (`tests/reconciliation-size-aware-diff.test.ts:212-235`) asserts only the second: it passes `actualImagePath` (`:227`), which takes the `if (!actualImage)` branch in `cmdDiff` **out of play entirely** (`tools/generate/src/cli/perceptual.ts:455-473`). The unexercised line is `viewport: opts.size` at `:467`, the sole forwarding of `--size` to `cmdShot`. **Failure mode:** delete `perceptual.ts:467` and every AC in this capability still passes, while `1c diff --size mobile` shoots the reproduction at desktop and diffs that against the 390px reference — a maximal, all-red pixel report that misattributes a viewport bug to fidelity drift. The sibling `test_UAT_FC_REQ-61_pixel_size_selects_matching_width_screenshot` (`tests/req61-size-pixel-diff.test.ts:35`) is the identical shape and equally blind, so no other test covers it; `cmdShot`'s own viewport honouring is proven separately at `tests/shot.test.ts:133` with a fake `driverFactory`, which is the ready-made pattern | Add a leg driving `cmdDiff` **without** `actualImagePath` — supply `slug` plus a fake `driverFactory` (mirroring `tests/shot.test.ts:133` and the `MarkerScreenshotDriver` at `…size-aware-diff.test.ts:312`) and assert the driver's `screenshot` received `VIEWPORTS.tablet`, i.e. that `--size` reached the shot, not just the reference selection |
| 3 | violation | coverage | AC-720 `acceptance_criterion-72db61ca` (STORY-79 `story-e15a19ef`) | uat-edit | AC-720's Criterion bullet 1 and its Verification both close on an **end-to-end** observable: "the drift-aligned ref/ours crop pairs are emitted from that sandbox reproduction (for a real sandbox reproduction with matching anchors, a non-empty set of crop pairs is produced)" / "End-to-end, `1c aligned-crops <slug> --sandbox` against a rendered sandbox reproduction emits a non-empty set of crop pairs from the sandbox build." `test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve` (`tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:33-75`) covers only the pure `subRenderOptions` seam, and the file's own docstring states the rest is **not automated**: "the browser + sharp crop pipeline downstream of it is the orchestrator (the commit's end-to-end check — 7 crop pairs from a rendered sandbox reproduction — is **manual**)" (`:16-19`). So the matrix advertises evidence that exists only as a one-time manual observation. This matters more than a normal options-plumbing gap because the regression AC-720 was written to prevent — "`--sandbox` was ignored by the render/serve step … so that no valid crops could be produced" — is defined by crop-pair emptiness, which the seam test cannot see: `subRenderOptions` could return a perfectly-shaped object that a caller then ignores | Either (a) add a browser-gated end-to-end leg — the repo's `const itB = it.runIf(browserOk)` pattern (`tests/req62-gradient-panel.test.ts:34`, `tests/req58-wrapper-treatments.test.ts:32`) exists for exactly this — asserting a non-empty crop-pair set from a rendered sandbox reproduction; or (b) if that is judged genuinely un-automatable, **ac-edit** AC-720 to drop the end-to-end clause from its Criterion and Verification so the matrix stops claiming it. Do not leave the AC asserting a manual check |
| 4 | warning | consistency | AC-658 `acceptance_criterion-7f078026` (STORY-79 `story-e15a19ef`) | uat-edit | Same shape as finding 1, one degree weaker. AC-658's Verification says "**Run a `values-diff` command** under conditions that trigger render chatter and capture stdout and stderr separately"; `test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr` (`tests/reconciliation-1c-cli-output-hygiene.test.ts:100-132`) instead calls `withCleanStdout` with three hand-written diagnostics and checks the stream split. Weaker than finding 1 because the AC's load-bearing mechanism genuinely *is* the wrapper (the AC names it: "the stdout→stderr diversion … stays in place"), and the test file declares its boundary honestly at `:14-19`. But nothing proves the CLI still *wraps* the values-diff compute — remove the `withCleanStdout(…)` call at `tools/generate/src/cli/index.ts:491` and this test stays green while every render diagnostic lands on stdout | Fold into finding 1's fix: once the UAT drives `run(['values-diff', …])`, assert the stream split there. `withCleanStdout`'s own contract is already independently owned by AC-659, whose Verification correctly names the wrapper |
| 5 | warning | consistency | AC-639 `acceptance_criterion-c6534e1a` (STORY-77 `story-16f2793c`) | uat-edit | AC-639's Criterion states "the reference values are those captured at the selected size's width **and the reproduction is rendered at that same viewport**". `test_UAT_AC639_values_diff_size_compares_at_selected_viewport_width` (`tests/reconciliation-size-aware-diff.test.ts:109-132`) supplies the actual side as `actualManifestPath` (`:118`), so the second clause is unexercised — the unguarded line is `extractDraftManifest(opts.slug, …, viewport)` at `tools/generate/src/cli/fidelity.ts:167`, the values-diff twin of finding 2's `perceptual.ts:467`. Filed as a **warning** rather than a violation because AC-639's *Verification* section asks only to "confirm the reference values used are the ladder's values at the mobile width" — which the test does, precisely, via `expectedSource` (`:124-125`). The gap is between the Criterion and the Verification, not between the Verification and the test | Add the mirror leg to finding 2's fix: drive `cmdValuesDiff` with a `slug` + fake `driverFactory` and assert the driver was sized to `VIEWPORTS[size]`. Fixing 2 and 5 together closes both size-aware commands' actual-side seam |
| 6 | warning | coverage | AC-631 `acceptance_criterion-65b5ddd3` (STORY-75 `story-d5de22a5`) | uat-add | AC-631's Criterion is "the surface colour **captured and compared** … is its effective rendered colour after compositing", and its Verification opens "**Capture** a fixture containing a translucent white card over a tinted band **and diff it**". `test_UAT_AC631_surface_fill_is_composited_alpha_colour` (`tests/reconcile-values-diff-fidelity.test.ts:73-101`) owns only the compare leg — it hand-derives the blend from the compositing formula (`:86-87`) and feeds it in as fixture. It cites the capture leg's owner honestly (`:12-14`, `:82-84`): `test_UAT_FC_REQ-58_surface_fill_composites_translucent_over_band` at `tests/req58-wrapper-treatments.test.ts:71`. That sibling is real and correct, but it is **browser-gated** — `itB = it.runIf(browserOk)` at `:32`, `browserOk = await chromiumAvailable()` — so where Chromium is absent the capture leg has **no executing evidence at all** (this cycle's run skipped exactly this class: the two `test_UAT_FC_REQ-62_*` capture tests skipped in `req62-gradient-panel.test.ts`). The remedy already exists as a pattern **inside this same story**: AC-711's capture leg is proven by `test_UAT_AC711_list_marker_recorded_only_where_a_marker_is_painted` (`tests/reconciliation-capture-list-marker.test.ts:59`), which runs the real `EXTRACT_SCRIPT` under jsdom — environment-independent, no browser | Author a second AC-711-style UAT for AC-631's capture leg: mount a translucent card over a tinted band, run the real `EXTRACT_SCRIPT` under jsdom, and assert the captured `surfaceFill` is the blended tint, not `#ffffff`. This is also the natural home for the STORY-76 surface-gradient capture leg that ac-level finding 2 (`report-728bd245`) asked for — both are ancestor-walk capture rules with the same shape |
| 7 | info | — | AC-637 `acceptance_criterion-377af866` (STORY-76 `story-82eb6908`) | — | `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` (`tests/req62-gradient-panel.test.ts:69-83`) exercises `resolveSurfaceGradient` — exactly what AC-637's **body** specifies, and it passes. The AC's **title** ("A text-block authored with a gradient panel renders a padded, rounded panel…") describes a render on a module the REQ-79/84 pivot deleted. The test is right and the title is wrong; this is already filed as violation 1 of `report-728bd245` (ac level) and needs no uat-level action | none — resolve at ac level (still open) |
| 8 | info | — | AC-711 `acceptance_criterion-7c503447` (two tests) | — | AC-711 is the only AC with two UATs. They are **complementary, not redundant**: `…treatments.test.ts:64` diffs the five treatment axes through `diffManifests`; `reconciliation-capture-list-marker.test.ts:59` proves the painted-marker capture precondition through the real `EXTRACT_SCRIPT`. Different legs, different boundaries. Exclusivity holds across all 37 tests | none — recorded so a future cycle does not mistake the pair for a duplicate |

## Notes for the Editor

**One cross-cutting pattern accounts for findings 1–5.** Five of the six
non-info findings are the same defect: the UAT drops one level below the command
its AC names and tests the seam instead. The pattern is always benign-looking —
the seam test is well-written, fast, deterministic, and honestly documented — but
it leaves the *wiring* between the CLI and the seam unguarded, and the wiring is
a single line in every case:

- `tools/generate/src/cli/index.ts:491` — `withCleanStdout(…)` around the
  values-diff compute (findings 1, 4)
- `tools/generate/src/cli/perceptual.ts:467` — `viewport: opts.size` → `cmdShot`
  (finding 2)
- `tools/generate/src/cli/fidelity.ts:167` — `viewport` → `extractDraftManifest`
  (finding 5)
- the `subRenderOptions` → `cmdRender`/`startServe` handoff (finding 3)

Delete any one of those lines and the whole capability stays green. That is
the "clean gate, different render" condition CAP-63's charter names as its reason
to exist, relocated from the reproduction into the tooling.

**The fix is cheaper than it looks, and two fixes cover four findings.**
Findings 2 and 5 are the same edit on the two size-aware commands; findings 1 and
4 are the same edit on the values-diff CLI path. Every ingredient is already in
the repo: `MarkerScreenshotDriver` (`…size-aware-diff.test.ts:312`) for a fake
`BrowserDriver`, `tests/shot.test.ts:133` for viewport-forwarding assertions, the
byte-level stdout harness (`…output-hygiene.test.ts:62-67`), and the
`runCli`/exit-code harness (`reconciliation-responsive-diff.test.ts:74-90`). No
new infrastructure is needed, and no test needs to become browser-dependent.

**STORY-78 is the model to copy.** All nine of its UATs drive the command through
`run(argv)` and assert on the stdout/stderr/exit-code the user actually sees —
which is why it is the only story in this capability with zero findings. Where a
story's ACs describe command behaviour, the CLI boundary is the correct test
boundary; the seam is the right boundary only when the AC itself names the seam
(as AC-656 and AC-659 do, and both are correctly aligned).

**Contrast worth preserving.** Findings 1–5 are not a call to make these tests
heavier everywhere. The capability's pure diff-engine UATs (AC-629…AC-636,
AC-711…AC-715) are exemplary: they drive the real exported `diffManifests` — the
same code path the CLI runs — with fixture manifests, assert the differ / match /
absent-one-side legs of every axis, pin severities, and stay deterministic and
sub-second. Nothing about them should change.

**Carry-over from ac level (not re-litigated here).** `report-728bd245`'s two
violations are still open: AC-637's stale title (finding 7 above is its uat-level
shadow) and STORY-76's missing surface-gradient *capture* AC. The latter and
finding 6 are the same underlying gap — capture-side ancestor-walk rules with no
environment-independent evidence — and are most efficiently repaired together,
using the AC-711 jsdom + `EXTRACT_SCRIPT` pattern for both.
