---
uid: report-ef43f04b
id: REPORT-2099
type: report
title: 'UAT Coverage: 1c Capture & Diff Fidelity'
created_by: xgd
created_at: '2026-08-16T09:20:30.843857+00:00'
updated_at: '2026-08-16T09:20:30.843857+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-aa030c83
  violations: 8
  warnings: 8
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c Capture & Diff Fidelity

**Result**: FAIL
**AC verdicts**: 41 pass, 6 fail, 1 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 3 fail, 1 stale, 0 needs_review
**Capability verdict**: fail

Scope: 48 ACs across five stories — STORY-75 (14), STORY-76 (5), STORY-77 (8),
STORY-78 (9), STORY-79 (12). AC-637 carries `lifecycle: deprecated` and is
excluded from the coverage obligation.

**Coverage is structurally complete.** All 47 active ACs have at least one
`test_UAT_AC<n>_*` test — verified this pass by walking every file under `tests/`
and mapping matches against the AC-number set. No AC is testless. Every finding
below is about **depth of evidence**, not absence of it.

**Evidence note — tests were NOT executed this pass.** Test execution is blocked
in this session (`npx` / `node_modules/.bin/vitest` both denied). Every finding
below is therefore derived from reading the test source against the current
production source, and each names the specific production line that can be
deleted with the whole capability still green. The one finding that ordinarily
needs execution to demonstrate — the vacuous pass in finding 8 — is provable from
source: `if (!capture) return` at `tests/bug27-nested-backdrop-capture.test.ts:82`.
The previous cycle (`report-132ab8fb`) did execute these files and reached the
same six failing ACs.

## Cumulative Intent Considered

Chronological ledger. Every intent that touched this capability's tree is
`free_and_reconciled`; all count. Re-read from the stories' `intent_uid` /
`updated_by` fields this pass — no new intent since 2026-08-07.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 (BUNDLE-16 `bundle-15c1f647`) | free_and_reconciled | 2026-07-03 | Per-command install preflight — refuse on a tree that does not match the manifests | YES |
| REQ-58 / REQ-59 / REQ-61 / REQ-62 (BUNDLE-6 `bundle-ab9e0cb6`) | free_and_reconciled | 2026-07-17 | Capture/diff blind spots, viewport ladder, `--size`, `responsive-diff`, gradient stops + panel gradient | YES |
| REQ-63 / REQ-79 / REQ-82-84 (BUNDLE-7 `bundle-31e474b9`) | free_and_reconciled | 2026-07-22 | Typography/effect axes; aligned-crops sandbox routing; layout modules stripped to L1 | YES (REQ-84 retires) |
| REQ-89 / BUG-10 (BUNDLE-8 `bundle-cceaba25`) | free_and_reconciled | 2026-07-29 | Quiet bootstrap at source; on-demand Astro container; painted-marker precondition | YES |
| REQ-114 (`request-3cd338cd`) | free_and_reconciled | 2026-07-31 | L1 palette colour model — literal base, palette overlay; **retires the palette-role alias stop** | YES (retires) |
| BUG-27 (BUNDLE-11 `bundle-ee56a66e`) | free_and_reconciled | 2026-08-05 | Band painted extent + document-wide backdrops | YES |

Two intents retire behaviour this capability still describes: **REQ-84** (deleted
the `text-block` layout module — the tree now carries only `carousel/` and
`contact-form/` under `packages/framework/src/modules/`) and **REQ-114** (retired
the palette-role gradient stop).

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-75 | REQ-58, REQ-63, BUG-10, BUG-27, REQ-96 | aligned | 12/14 ACs substantively covered; AC-631 and AC-815 are the gaps |
| STORY-76 | REQ-59, REQ-62, REQ-84, REQ-114 | **stale** | Body still claims a stop colour may be "a palette-role alias (absolute-or-overlay)" — REQ-114 retired that; and §2 "Authored" still declares a live authoring half whose sole AC (AC-637) is now deprecated |
| STORY-77 | REQ-61, REQ-58 (ladder) | aligned | 6/8 covered; AC-639 and AC-643 share one blind spot — the actual-side render/shot at the selected viewport |
| STORY-78 | REQ-61 | aligned | Fully covered — all nine ACs drive `run(argv)` at the real CLI boundary |
| STORY-79 | REQ-58, REQ-79, REQ-89, REQ-44 | aligned | 10/12 covered; AC-657 and AC-720 are the gaps |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | uat | AC-657 | uat-edit | AC: "When a `values-diff` command (single-width or `--multi-viewport`) is run with `--json`, everything written to stdout is exactly one well-formed JSON document"; Verification: "Run a `values-diff --json` command and capture stdout only." `test_UAT_AC657_json_is_exactly_one_parseable_document` (`tests/reconciliation-1c-cli-output-hygiene.test.ts:53`) **never invokes the command** — it calls `withCleanStdout` directly, writes three fake diagnostics inside it (`:71-73`), then writes `JSON.stringify(report)` itself (`:77`) and parses what it just wrote. Its own docstring concedes: "Faithful reproduction of run()'s `--json` path". Verified this pass: `values-diff` has **two** `--json` emit paths — multi-viewport `console.log` at `index.ts:787` (wrapped `:769`) and single-width at `:815` (wrapped `:802`) — and the AC names both. Neither is observed | Drive the real command and assert the **entire** captured stdout parses as one document. Prefer the subprocess harness (`spawnSync('node',[bin,'values-diff',…,'--json'])`) — the pattern AC-738 already uses at `…astro-free-render.test.ts:113-124` — because the guarantee is about the byte stream. Add a `--multi-viewport --json` leg |
| 2 | violation | uat | AC-643 | uat-edit | AC Criterion has two clauses — "**shoots the reproduction at the selected viewport** *and* compares it against the … same-width screenshot". `test_UAT_AC643_…` (`tests/reconciliation-size-aware-diff.test.ts:212`) asserts only the second: it passes `actualImagePath` (`:226`), which takes the `if (!actualImage)` branch at `tools/generate/src/cli/perceptual.ts:483` out of play. The unexercised line is `viewport: opts.size` at `perceptual.ts:493` — the sole forwarding of `--size` into the reproduction shot. **Failure mode:** delete `perceptual.ts:493` and every AC here still passes, while `1c diff --size mobile` shoots at desktop and diffs against the 390px reference — an all-red report misattributing a viewport bug to fidelity drift | Add a leg driving `cmdDiff` **without** `actualImagePath` — supply `slug` plus a fake `driverFactory` (`MarkerScreenshotDriver` at `…size-aware-diff.test.ts:312` is the ready-made pattern) and assert the driver's `screenshot` received `VIEWPORTS.tablet` |
| 3 | violation | uat | AC-639 | uat-edit | Same blind spot on the values-diff path. AC Criterion: "the reference values are those captured at the selected size's width **and the reproduction is rendered at that same viewport**". `test_UAT_AC639_…` (`:109`) supplies `actualManifestPath` (`:118-121`), taking the early-return at `tools/generate/src/cli/fidelity.ts:160-161`. The unexercised line is `extractDraftManifest(…, viewport)` at `fidelity.ts:167` — the only place `viewport` reaches the render. The reference-selection half *is* well proven (`expectedSource` at `:124-125`) | Mirror finding 2's fix: drive `cmdValuesDiff` with `slug` + fake `driverFactory`, assert the driver was sized to `VIEWPORTS[size]`. Fixing 2 and 3 together closes both size-aware commands' actual-side seam |
| 4 | violation | uat | AC-815 | uat-edit | AC Verification names **four** assertions; only two are made. Covered: the collapsed header, the off-canvas block. **Unexercised (a):** "an overflow-clipped carousel with off-stage slides … assert the carousel's band is no wider than the document". Verified this pass: `grep -c overflow tests/fixtures/capture/bug27-nested-backdrop.html` returns **0** — the fixture has no `overflow` declaration at all, so the clamp `Math.min(docW, …)` at `tools/generate/src/cli/capture/extract.ts:499` never runs. The one width assertion present (`:143`, `s.box.width <= cap.viewport.width + 1`) is satisfied by the off-canvas case, decided earlier by `onScreenBox` rejection at `extract.ts:491` — it does not stand in for the `docW` clamp. **Unexercised (b):** "assert a conventional band's box is unchanged from its own border box" — asserted nowhere, though `extract.ts:472`'s comment claims exactly that property. **Failure mode:** replace `Math.min(docW, acc.x + acc.width)` with `acc.x + acc.width` and both AC-815 tests still pass, while any `overflow: hidden` carousel captures a band hundreds of px wider than the page — re-opening the class of defect BUG-27 closed | Extend `bug27-nested-backdrop.html` with (i) an `overflow: hidden` carousel whose slides extend past its box, (ii) a conventionally laid-out band. Assert the carousel band's width is bounded by the document's `scrollWidth` (not the viewport, which `:143` already checks), and the conventional band's box equals its own border box |
| 5 | violation | uat | AC-720 | uat-edit (or ac-edit) | AC Criterion bullet 1 and Verification both close on an **end-to-end** observable: "the drift-aligned ref/ours crop pairs are emitted from that sandbox reproduction (… a non-empty set of crop pairs is produced)". `test_UAT_AC720_…` (`tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:33`) covers only the pure `subRenderOptions` seam — three `expect`s on `sub.sandbox`/`sub.cwd`/`sub.source` (`:69-73`) — and the file docstring concedes the rest "is manual" (`:16-19`). It never invokes `cmdAlignedCrops`, so it cannot show the mapper is *used*. This matters more than ordinary options-plumbing because the regression the AC exists to prevent is *defined* by crop-pair emptiness, which the seam cannot see: `subRenderOptions` can return a perfectly-shaped object a caller then ignores | Either (a) add a browser-gated end-to-end leg asserting a non-empty crop-pair set from a rendered sandbox reproduction — the repo's `it.runIf(browserOk)` idiom (`tests/req58-wrapper-treatments.test.ts:32`) exists for this; or (b) if judged un-automatable, **ac-edit** AC-720 to drop the end-to-end clause. Do not leave the AC asserting a manual check |
| 6 | violation | uat | AC-631 | uat-add | AC Criterion: the surface colour "**captured and compared** … is its effective rendered colour after compositing"; Verification: "**Capture** a fixture … **and diff it**". `test_UAT_AC631_…` (`tests/reconcile-values-diff-fidelity.test.ts:73`) computes the blend **in the test** (`(255+217)/2` …) and feeds that literal into both manifests — proving only that `diffManifests` compares a `surfaceFill` string, which AC-632's equality legs already prove. The test cites its capture-side owner honestly (`:81-84`): `test_UAT_FC_REQ-58_surface_fill_composites_translucent_over_band`, which is real but (a) not AC-named and (b) browser-gated via `it.runIf(browserOk)` (`tests/req58-wrapper-treatments.test.ts:32`) — so where Chromium is absent the capture half has no executing evidence | Author an AC-711-style UAT for the capture leg: the remedy pattern is inside this same story — `test_UAT_AC711_list_marker_recorded_only_where_a_marker_is_painted` (`tests/reconciliation-capture-list-marker.test.ts:59`) runs the real `EXTRACT_SCRIPT` under jsdom, environment-independent. Mount a translucent card over a tinted band, assert the captured `surfaceFill` is the blended tint, not `#ffffff` |
| 7 | violation | story | STORY-76 | story-body-edit | Body §2 "Authored" ends: "Each stop colour is an absolute hex literal **or a palette-role alias (absolute-or-overlay)**." REQ-114 (`request-3cd338cd`, free_and_reconciled 2026-07-31) retired the palette-role half. Re-read live this pass — the clause is still present | Delete the palette-role-alias clause; state the stop is a hex literal, noting an L1 palette reference resolves to a literal before the resolver/validator sees it |
| 8 | violation | story | STORY-76 | story-body-edit | Body §2 still declares a live authoring half ("**Authored** — a standalone `gradient` content-field value type … resolves … to a panel/card `background-image: linear-gradient(...)` surface fill"), but its **sole** AC, AC-637, is now `lifecycle: deprecated`. The story therefore promises behaviour the matrix no longer evidences at any AC. The surviving artifact is real — `resolveSurfaceGradient` lives at `packages/framework/src/modules/text-style.ts` and the capability body's own value-axis ownership rule names it the superseded module authoring surface | Either re-scope the clause to the surviving resolver-level claim and **ac-add** a replacement AC for it ("a gradient content value resolves via `resolveSurfaceGradient` to a `background-image: linear-gradient(...)`; under-specified → no fill"), or delete the authoring half from the body. Do not leave a body claim with no active AC |
| 9 | warning | uat | AC-815, AC-816 | uat-edit | The `itA` helper (`tests/bug27-nested-backdrop-capture.test.ts:80-84`) does `if (!capture) return // Chromium unavailable — skip silently` — the test reports **PASS with zero assertions executed** rather than SKIP. AC-815's *entire* evidence is gated this way (hence its `fail` verdict stands on finding 4 regardless); AC-816 keeps its `pass` because four browser-free `foldToL1` tests (`:213-249`) execute for real. A green vacuous test reports coverage that does not exist | Switch `itA` to `it.runIf(browserOk)` so an absent browser reports **skipped** — the correct pattern is three files away (`tests/req58-wrapper-treatments.test.ts:32`, `tests/req62-gradient-panel.test.ts`) |
| 10 | warning | uat | AC-658 | uat-edit | Verdict is **pass** — the AC names `withCleanStdout` as its mechanism and the test drives the real primitive, including the stream split. But nothing proves the CLI still *wraps* the values-diff compute: remove either `withCleanStdout(…)` call (`index.ts:769`, `:802`) and this stays green. The AC's other clause (bootstrap quiet at source) is genuinely proven by AC-738's real-binary subprocess | Fold into finding 1's fix — once the UAT drives the real `values-diff`, assert the stream split there. No separate work item |
| 11 | warning | story | STORY-75 | story-body-edit | Technical Context: "Belongs to capability **1c Values-Diff Fidelity** (`capability-aa030c83`)" — a capability name retired by the 2026-08-05 consolidation into "1c Capture & Diff Fidelity" | Update to the current capability name |
| 12 | warning | story | STORY-77 | story-body-edit | Technical Context: "Generalizes **CAP-63 (1c Values-Diff Fidelity)**, which compares at a single fixed width" — same retired name | Same |
| 13 | warning | story | STORY-78 | story-body-edit | Technical Context: "Belongs to **CAP-65 (1c Size-Aware Diffing)**, whose body already reserves this downstream `responsive-diff` command" — CAP-65 was merged into CAP-63 on 2026-08-05 | Same |
| 14 | warning | story | STORY-79 | story-body-edit | Related-capabilities paragraph names "**CAP-63 (1c Values-Diff Fidelity), CAP-65 (1c Size-Aware Diffing)**" as two distinct capabilities | Same |
| 15 | warning | story | STORY-79 | field-edit | Body attributes guarantees 2–4 to `bundle-31e474b9` (BUNDLE-7) and `bundle-cceaba25` (BUNDLE-8), but `fields.updated_by` lists only `bundle-15c1f647`. Both cited bundles are `free_and_reconciled`, so the content is sound — the ledger field is incomplete | Add `bundle-31e474b9` and `bundle-cceaba25` to `updated_by` |
| 16 | warning | infra | `.xgd/uat_index.json` | index-rebuild | The index was regenerated 2026-08-16T00:03 and is **empty** — `{"updated_at": …, "acs": {}}`. Every AC in the project reads as untested to any tooling that consumes it. This assessment worked around it by walking `tests/` directly; a fix workflow that trusts the index will see 48 phantom gaps here and behave unpredictably project-wide | Rebuild the UAT index. This is a project-wide infrastructure defect, not specific to this capability |

## Notes for the Editor

**One cross-cutting pattern accounts for findings 1, 2, 3, 5 and 10: the test
drives the seam *beside* the behaviour instead of the entry point that uses it.**
AC-639/643 inject a pre-made actual side and so skip the only branch carrying
`viewport` into the render/shot; AC-657/658 stop at `withCleanStdout` instead of
running the command; AC-720 tests the pure options mapper but never the command
that calls it. In each case the line that actually implements the AC
(`fidelity.ts:167`, `perceptual.ts:493`, `index.ts:769`/`:787`/`:802`/`:815`,
`aligned-crops.ts:196`) can be deleted with the whole capability still green.
All are fixable with harnesses that already exist in this repo — the `spawnSync`
real-binary pattern (`…astro-free-render.test.ts:113-124`), the in-process
`runCli` (`…responsive-diff.test.ts:74-90`), and the fake-`driverFactory`
(`…size-aware-diff.test.ts:312`). Fixing them as one batch clears four violations
and one warning.

**For finding 1 specifically, prefer the subprocess harness over `runCli`.**
`runCli` spies on `console.log`, observing the *arguments* to the log call rather
than the stdout byte stream AC-657 is about; it would not catch a stray raw
`process.stdout.write`.

**Findings 4 and 9 both land on AC-815 and must be repaired together** — the
fixture needs new elements (the overflow-clipped carousel, the conventional band)
*and* the harness must stop passing silently when the browser is absent.
Repairing only the assertions leaves them potentially never executed.

**Findings 7 and 8 are the REQ-84/REQ-114 tail on STORY-76 and belong in one
pass.** Note the resolver itself is alive and correct — this is a
wording/lifecycle correction, not a capability loss.

**Findings 11–14 are one batch** — a single search-and-replace over four story
bodies replacing the pre-consolidation capability names.

**Not defects — recorded so the next round does not re-litigate them:**
- AC-739's `vi.spyOn` on `experimental_AstroContainer.create` is legitimate: the
  *construction* is precisely the observable the AC names.
- AC-817's three tests are browser-free and drive the real `diffManifests`.
- STORY-78's nine ACs are the strongest evidence in the capability — every one
  driven through `run(argv)` with a bundle authored on disk. STORY-79's
  install-preflight ACs (1013–1017) are likewise strong, pairing `assertInstall`
  legs with real-binary subprocess legs and asserting the workspace is left
  byte-for-byte unchanged.
- Six ACs carry multiple tests (711, 815, 816, 817, 1013, 1016); all are
  complementary shapes, none redundant.

**ESCALATION — the fix loop is not reaching `tests/`.** This is the seventh
attempt at this level. The same six ACs (631, 639, 643, 657, 720, 815) have now
failed in consecutive rounds, and `git log` over the five artifacts involved
(`reconciliation-1c-cli-output-hygiene.test.ts`,
`reconciliation-size-aware-diff.test.ts`,
`reconciliation-1c-aligned-crops-sandbox-routing.test.ts`,
`bug27-nested-backdrop-capture.test.ts`,
`fixtures/capture/bug27-nested-backdrop.html`) returns **no commit after
`164dc05ab` (2026-08-05)** — not one has been edited across any cycle.

Meanwhile two repairs *have* landed in that window, both on **ticket** surfaces:
AC-637's deprecation, and the earlier STORY-76 story-level edits. That asymmetry
is the diagnostic signal — the editor acts on `ac-edit` / `ac-deprecate` /
`story-body-edit` and **not** on `uat-edit` / `uat-add`. Every unrepaired finding
here is in the latter two categories. Production has meanwhile moved on:
`index.ts` gained a second `--json` emit path since the last cycle, so the
untested surface is growing, not static.

Two concrete asks before the next cycle, neither of which this assessment can
perform:
1. Confirm the downstream editor can write to `tests/` at all. If it cannot,
   this level cannot converge regardless of finding quality, and re-filing these
   an eighth time will not change the outcome.
2. Rebuild `.xgd/uat_index.json` (finding 16) — it is empty project-wide, and any
   fix workflow that trusts it will mis-target.

Note also that test **execution** was unavailable in this session, so this pass
could not re-confirm the runtime behaviour the previous cycle observed. The
findings stand on source analysis and each names a deletable production line;
but a fix round should run the suite to confirm the repairs land.
