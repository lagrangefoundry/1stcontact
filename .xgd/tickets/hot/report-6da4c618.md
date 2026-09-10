---
uid: report-6da4c618
id: REPORT-3602
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=uat)'
created_by: xgd
created_at: '2026-09-10T00:12:31.067547+00:00'
updated_at: '2026-09-10T00:12:31.067547+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: uat
  violations: 4
  warnings: 6
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: uat

**Result**: FAIL
**Violations**: 4
**Warnings**: 6
**Needs review**: 0

Scope: **7 stories, 83 ACs** — 69 `active`, 13 `pending`, 1 `deprecated`. Up from
the 5 stories / 48 ACs of the last uat-level pass (`report-845f21a1`,
2026-08-16, FAIL 4/4/0): STORY-124 and STORY-125 joined the capability on
2026-08-31, STORY-79 gained AC-1415…AC-1417 (REQ-150), and 13 `pending` ACs
(AC-1605…AC-1617) were authored **~15 minutes before this check** by this same
cycle's ac-level fix (`report-11c8bf8e`, ac PASS at 00:02).

**Coverage of active ACs is structurally complete.** Every one of the 69 active
ACs carries at least one `test_UAT_AC<n>_*` test — verified by enumerating every
`test_UAT_AC<n>` name under `tests/`, `packages/`, `tools/`, `apps/` and diffing
against this capability's AC-number set. **Exclusivity is clean** (finding 11).
Every violation below is about **depth of evidence**, not absence of it.

**The four violations are the same four as 2026-08-16, re-derived (not copied)
against current code, and this is their fifth consecutive filing (fourth for
finding 4).** The escalation in the previous report — "the fix loop is not
reaching these test files" — is **partly falsified this cycle and otherwise
confirmed**:

- `tests/reconciliation-size-aware-diff.test.ts` **was** edited today
  (`4beb152fa2`, 2026-09-09) by `fix_ac_validation`, which added ladder-manifest
  assertions to AC-647. So the editor **can** write to `tests/`. The August
  hypothesis that it cannot is disproved.
- The other four artifacts named in that report are still untouched: `git log -1`
  returns `3d20958cd` (2026-07-18) for `reconciliation-1c-cli-output-hygiene.test.ts`,
  `087e145261` (2026-07-22) for `reconciliation-1c-aligned-crops-sandbox-routing.test.ts`,
  `164dc05abb` (2026-08-05) for `bug27-nested-backdrop-capture.test.ts`, and
  `5ecbe57b2c` (2026-07-25) for `tests/fixtures/capture/bug27-nested-backdrop.html`.

**Newly assessed this pass and clean**: STORY-124 (10 ACs) and STORY-125 (7 ACs),
both of which land in this capability for the first time at uat level, and
STORY-79's AC-1415…AC-1417. All 20 drive real entry points — the Worker's own
`fetch` against real D1/R2, `shotPreview` against a fake browser seam, the real
`1c` binary via `spawnSync` — and are among the strongest UATs in the capability
(finding 12).

Per the level cascade, **AC bodies are the working reference.** Every quoted
Criterion / Verification string below was read from the live AC ticket this pass.
Intent was consulted only to confirm no ledger entry is retired (see below).

## Cumulative Intent Considered

Stories record intent as *bundle* UIDs. All eight bundles touching this
capability's tree were re-read live this pass and **every one carries
`free_and_reconciled`**, so every intent below counts. **No intent in this
capability's tree carries `abandoned`, `deprecated` or `wont_fix`** — checked,
not assumed — so **Step 2.5's stale-vehicle case does not arise anywhere in this
report.**

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` (REQ-58/59/61/62) | free_and_reconciled | 2026-07-17 | `intent_uid` of STORY-75…79; `--size`, ladder, `responsive-diff`, gradient stops + panel gradient | YES |
| BUNDLE-7 `bundle-31e474b9` (REQ-63, REQ-79, REQ-82/83/84 +2) | free_and_reconciled | 2026-07-22 | Typography/effect axes (AC-711…714); aligned-crops sandbox routing (AC-720) | YES |
| BUNDLE-8 `bundle-cceaba25` (REQ-89, BUG-7, REQ-90…92 +5) | free_and_reconciled | 2026-07-29 | Quiet bootstrap (AC-738/739); painted-marker precondition | YES (REQ-89 superseded by REQ-150) |
| BUNDLE-10 `bundle-4ff83a8b` (BUG-12…BUG-16 +11) | free_and_reconciled | 2026-07-29 | Offline re-extract against mirrored faces (→ AC-1607) | YES |
| BUNDLE-11 `bundle-ee56a66e` (BUG-27, REQ-94/96/97/98 +10) | free_and_reconciled | 2026-08-05 | Backdrop / collapsed-subtree capture (AC-815/816/817); REQ-96 retired the resolver leg | YES |
| BUNDLE-16 `bundle-15c1f647` (REQ-44, REQ-115, REQ-117) | free_and_reconciled | 2026-08-07 | Per-command dependency preflight (AC-1013…AC-1017) | YES |
| BUNDLE-20 `bundle-b3b7c399` (REQ-143…REQ-148, REQ-150 +5) | free_and_reconciled | 2026-08-24 | Plain Vite SSR launcher; Astro out of the repo (AC-1415…1417, AC-739's rewrite) | YES (supersedes REQ-89) |
| BUNDLE-22 `bundle-8eef3846` (REQ-154 + BUG-39) | free_and_reconciled | 2026-08-31 | Cloud Browser Rendering driver behind the existing seam; self-origin fulfilment (STORY-124/125) | YES |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| **STORY-75** `story-d5de22a5` — 20 ACs (14 active, 6 pending) | BUNDLE-6, BUNDLE-7, BUNDLE-8, BUNDLE-10, BUNDLE-11 | **1 violation, 3 warnings.** AC-629/630/632/633 and AC-711…715 drive the real `diffManifests`; AC-816 (8 tests) and AC-817 (3) are exemplary; AC-818 drives the real `extractFields`. **AC-815 is the outlier** (findings 4 + 8); **AC-631** owns only the compare leg (finding 7). Its six pending ACs (AC-1605…1610) carry no AC-named test (finding 10) |
| **STORY-76** `story-82eb6908` — 7 ACs (4 active, 2 pending, 1 deprecated) | BUNDLE-6 (REQ-59, REQ-62), REQ-72; retired legs: REQ-84/REQ-96 (resolver), REQ-114 (palette alias) | **aligned at uat level.** AC-634/635/636/638 drive the real `diffManifests` / `validateModuleContent`. AC-637 deprecated — no uat obligation (finding 9). AC-1611/1612 pending (finding 10) |
| **STORY-77** `story-16f2793c` — 14 ACs (9 active, 5 pending) | BUNDLE-6 (REQ-58, REQ-61), REQ-64, REQ-76 | **1 violation, 1 warning.** AC-640/641/642/644/645 drive `cmdValuesDiff` / `cmdDiff` for real, including both fail-loud paths. AC-647 was **strengthened today** (`4beb152fa2`) and now asserts a per-element manifest at every rung, not merely a screenshot. **AC-643 (finding 2) and AC-639 (finding 6) share one blind spot** — both inject a pre-made actual side. AC-1613…1617 pending (finding 10) |
| **STORY-78** `story-2c7069fe` — 9 ACs (all active) | BUNDLE-6 (REQ-61) | **aligned — still the strongest legacy story here.** All nine drive `run(argv)` at the true CLI boundary via the `runCli` harness (`tests/reconciliation-responsive-diff.test.ts:74-90`) |
| **STORY-79** `story-e15a19ef` — 16 ACs (all active) | BUNDLE-6, BUNDLE-7, BUNDLE-8, BUNDLE-16, BUNDLE-20 | **2 violations, 2 warnings.** AC-1415 and AC-738 spawn the real binary; AC-1416 scans manifests, lockfile, configs and disk; AC-1417 asserts dispatch order plus a real-binary `--json` leg; AC-739 drives three real renders; AC-1013…1017 pair `assertInstall` legs with real-binary subprocess legs. **AC-657 (finding 1), AC-720 (finding 3), AC-658 (finding 5) and AC-739's scan clause (finding 13) are the gaps** |
| **STORY-124** `story-080c6036` — 10 ACs (all active) | BUNDLE-22 (REQ-154, BUG-39) | **aligned — new at this level, assessed in full.** AC-1461 drives the Worker's own `fetch` for import → palette write → read-back → preview render → publish against real D1/R2 before asking for a picture, then asserts a named catchable `BrowserNotConfiguredError` naming `BROWSER` (`tests/reconciliation-cloud-browser-capture-absent.workers.test.ts:76-137`). AC-1465/1466/1467 drive `runMultiStateCapture` and evaluate the real page-scripts under jsdom. AC-1468 is a source-graph + manifest scan — the faithful shape for a static claim |
| **STORY-125** `story-7fa314f5` — 7 ACs (all active) | BUNDLE-22 (REQ-154, BUG-39) | **aligned — new at this level, assessed in full.** All seven drive the real `shotPreview` against a fake browser seam inside workerd, comparing the captured document byte-for-byte against what the `/preview/*` route serves (`tests/reconciliation-self-origin-capture.workers.test.ts:116-160`) and asserting the escaped-to-network list is *empty* rather than short (`:184`) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-657 `acceptance_criterion-9c235ff1` (STORY-79) | uat-edit | **Fifth consecutive filing**; file untouched since `3d20958cd` (2026-07-18). AC-657's Criterion is a property of *the command* — "When a `values-diff` command (**single-width or `--multi-viewport`**) is run with `--json`, everything written to stdout is exactly one well-formed JSON document" — and its Verification opens "**Run a `values-diff --json` command** and capture stdout only". `test_UAT_AC657_json_is_exactly_one_parseable_document` (`tests/reconciliation-1c-cli-output-hygiene.test.ts:53-94`) never invokes the command: it calls `withCleanStdout` directly, writes three fake diagnostics inside it (`:71-73`), then **writes the JSON document itself** (`:77`) and parses what it just wrote (`:86`). Its own docstring concedes this — "Faithful reproduction of run()'s `--json` path" (`:54`). Re-verified this pass: grepping `values-diff` across `tests/` finds no `run([...])` driver — the only argv-shaped hits are AC-656's `parseArgs` fixtures (`:33-34`) and AC-1017's gated-command *list* (`req44-install-preflight.test.ts:210`). The nearest sibling, `test_UAT_FC_REQ-58_multiviewport_json_stdout_clean` (`tests/req58-multi-viewport.test.ts:116-162`), **stops at the same seam** — it too calls `withCleanStdout` and then writes `{"clean":true}` itself (`:142`). Both of `values-diff`'s `--json` emit paths — multi-viewport `console.log(JSON.stringify(payload…))` (`tools/generate/src/cli/index.ts:787`, wrapped `:769`) and single-width (`:815`, wrapped `:802`) — remain unobserved. **Failure mode:** add any second `console.log` to either branch and stdout carries two documents, `\| jq` breaks, AC-657 is violated in production, and this UAT stays green because it never observed the command's stdout | Rewrite to invoke the command and assert the **entire** captured stdout parses as one JSON document equal to the report. Prefer the **subprocess** harness — `spawnSync('node', [bin, 'values-diff', …, '--json'])`, the pattern AC-738 already uses (`tests/reconciliation-1c-astro-free-render.test.ts:126-136`) and AC-1415 uses at `tests/reconciliation-1c-launcher-bootstrap.test.ts:154` — because AC-657's guarantee is about the *byte stream*, which the in-process `runCli` (spies `console.log`) cannot observe. Add a second leg for `--multi-viewport --json`. Keep the diagnostic-absence assertions |
| 2 | violation | consistency | AC-643 `acceptance_criterion-2ca1d9b9` (STORY-77) | uat-edit | **Fifth consecutive filing.** AC-643's Criterion has two clauses — "**shoots the reproduction at the selected viewport** *and* compares it against the reference bundle's same-width screenshot" — and its Verification names both: "assert **the reproduction is rendered/shot at the tablet viewport** *and* the reference image used is the tablet-width one". `test_UAT_AC643_pixel_diff_size_pairs_reproduction_against_same_width_reference` (`tests/reconciliation-size-aware-diff.test.ts:212-235`) asserts only the second: it passes `actualImagePath` (`:226`), which takes the `if (!actualImage)` branch at `tools/generate/src/cli/perceptual.ts:483` out of play entirely. The unexercised line is `viewport: opts.size` at `perceptual.ts:493` — the sole forwarding of `--size` into the reproduction shot; both line numbers re-confirmed against the current file this pass. Note the file **was** edited today (`4beb152fa2`) for AC-647, so this test was in the editor's hands and left unchanged. **Failure mode:** delete `perceptual.ts:493` and every AC in this capability still passes, while `1c diff --size mobile` shoots the reproduction at desktop and diffs it against the 390px reference — a maximal all-red pixel report that misattributes a viewport bug to fidelity drift | Add a leg driving `cmdDiff` **without** `actualImagePath` — supply `slug` plus a fake `driverFactory` (the `MarkerScreenshotDriver` at `…size-aware-diff.test.ts:312` is the ready-made pattern, as is `tests/shot.test.ts:133`) and assert the driver's `screenshot` received `VIEWPORTS.tablet` |
| 3 | violation | coverage | AC-720 `acceptance_criterion-72db61ca` (STORY-79) | uat-edit (or ac-edit) | **Fifth consecutive filing**; file untouched since `087e145261` (2026-07-22). AC-720's Criterion bullet 1 and its Verification both close on an **end-to-end** observable: "the drift-aligned ref/ours crop pairs are emitted from that sandbox reproduction (for a real sandbox reproduction with matching anchors, a non-empty set of crop pairs is produced)" / "End-to-end, `1c aligned-crops <slug> --sandbox` … emits a non-empty set of crop pairs from the sandbox build." `test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve` (`tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts:33-75`) covers only the pure `subRenderOptions` seam — three `expect`s on `sub.sandbox` / `sub.cwd` / `sub.source` (`:69-73`) — and the file's docstring still states the rest is not automated: "the browser + sharp crop pipeline downstream of it is the orchestrator (the commit's end-to-end check — 7 crop pairs from a rendered sandbox reproduction — is **manual**)" (`:16-19`). The matrix advertises evidence that exists only as a one-time manual observation. This matters more than ordinary options-plumbing because the regression AC-720 exists to prevent — "`--sandbox` was ignored by the render/serve step … so that no valid crops could be produced" — is *defined* by crop-pair emptiness, which the seam test cannot see: `subRenderOptions` can return a perfectly-shaped object that a caller then ignores | Either (a) add a browser-gated end-to-end leg asserting a non-empty crop-pair set from a rendered sandbox reproduction — the repo's `it.runIf(browserOk)` idiom (`tests/req58-wrapper-treatments.test.ts:32`) exists for exactly this; or (b) if judged genuinely un-automatable, **ac-edit** AC-720 to drop the end-to-end clause from Criterion bullet 1 and from the Verification's last sentence. Do not leave the AC asserting a manual check |
| 4 | violation | coverage | AC-815 `acceptance_criterion-9ccc1de8` (STORY-75) | uat-edit | **Fourth consecutive filing**; test untouched since `164dc05abb` (2026-08-05), fixture since `5ecbe57b2c` (2026-07-25). AC-815's Verification names **four** assertions; only two are made. Its two tests are `test_UAT_AC815_collapsed_header_subtree_is_captured` and `test_UAT_AC815_offscreen_block_does_not_become_or_inflate_a_band` (`tests/bug27-nested-backdrop-capture.test.ts:124`, `:137`), both driving the real `cmdCapturePage` against `tests/fixtures/capture/bug27-nested-backdrop.html`. Covered: the collapsed header and the off-canvas block. **Unexercised (a):** "an overflow-clipped carousel with off-stage slides … assert the carousel's band is no wider than the document". Re-verified this pass: `grep -c overflow tests/fixtures/capture/bug27-nested-backdrop.html` returns **0**, so the clip-vs-extend clamp the Criterion makes load-bearing in both directions ("Overflow that genuinely extends the document grows the canvas and is kept; overflow that is clipped does not and is cut") never runs. That clamp is `Math.min(docW, …)` / `Math.min(docH, …)` at `tools/generate/src/cli/capture/extract.ts:499`, whose own comment at `:492-497` names the missing fixture verbatim. The one width assertion present (`:143`, `s.box.width <= cap.viewport.width + 1`) is satisfied by the off-canvas case, decided earlier by a different mechanism (`onScreenBox` rejection at `extract.ts:491`), so it does not stand in for the `docW` clamp. **Unexercised (b):** "assert a conventional band's box is unchanged from its own border box" — asserted nowhere. **Failure mode:** replace `Math.min(docW, acc.x + acc.width)` with `acc.x + acc.width` and both AC-815 tests still pass, while any site with an `overflow: hidden` carousel captures a band hundreds of px wider than the page — re-opening precisely the class of defect BUG-27 closed | Extend `bug27-nested-backdrop.html` with (i) an `overflow: hidden` carousel whose slides extend well past its box, and (ii) a conventionally laid-out band. Add assertions that the carousel's band width is bounded by the document's `scrollWidth` (not merely the viewport, which is what `:143` already checks), and that the conventional band's captured box equals its own border box. **Repair together with finding 8** |
| 5 | warning | consistency | AC-658 `acceptance_criterion-7f078026` (STORY-79) | uat-edit | Same shape as finding 1, one degree weaker; unrepaired. AC-658's Verification says "**Run a `values-diff` command** under conditions that trigger render chatter and capture stdout and stderr separately"; `test_UAT_AC658_render_and_bootstrap_diagnostics_go_to_stderr` (`tests/reconciliation-1c-cli-output-hygiene.test.ts:100-132`) instead calls `withCleanStdout` with three hand-written diagnostics (`:114-116`) and checks the stream split. Weaker because the AC's load-bearing mechanism genuinely *is* the wrapper (the AC names it), the file declares its boundary honestly at `:13-19`, and the AC's other clause — bootstrap quiet *at source* — is cross-referenced to AC-738, which does spawn the real binary. But nothing proves the CLI still *wraps* the values-diff compute: remove either `withCleanStdout(…)` call (`index.ts:769`, `:802`) and this test stays green while every render diagnostic lands on stdout | Fold into finding 1's fix: once the UAT drives the real `values-diff` command, assert the stream split there |
| 6 | warning | consistency | AC-639 `acceptance_criterion-c6534e1a` (STORY-77) | uat-edit | Unrepaired — `tests/reconciliation-size-aware-diff.test.ts:118-121` still supplies `actualManifestPath`. AC-639's Criterion states "the reference values are those captured at the selected size's width **and the reproduction is rendered at that same viewport**". `test_UAT_AC639_values_diff_size_compares_at_selected_viewport_width` (`:109-132`) injects the actual side as a manifest, so the second clause is unexercised — the unguarded line is `extractDraftManifest(opts.slug, opts.source ?? 'draft', factory, opts, viewport)` at `tools/generate/src/cli/fidelity.ts:167`, the values-diff twin of finding 2's `perceptual.ts:493`. Filed as a warning rather than a violation because AC-639's *Verification* asks only to confirm the reference values come from the ladder at the selected width — which the test does precisely, via `expectedSource` (`:124-125`). The gap is between Criterion and Verification, not between Verification and test | Add the mirror leg to finding 2's fix: drive `cmdValuesDiff` with a `slug` + fake `driverFactory` and assert the driver was sized to `VIEWPORTS[size]`. Fixing 2 and 6 together closes both size-aware commands' actual-side seam |
| 7 | warning | coverage | AC-631 `acceptance_criterion-65b5ddd3` (STORY-75) | uat-add | Unrepaired — `tests/reconcile-values-diff-fidelity.test.ts:85-87` still hand-derives the blend from the compositing formula. AC-631's Criterion is "the surface colour **captured and compared** … is its effective rendered colour after compositing", and its Verification opens "**Capture** a fixture containing a translucent white card over a tinted band **and diff it**". `test_UAT_AC631_surface_fill_is_composited_alpha_colour` (`:73-101`) owns only the compare leg and cites the capture leg's owner honestly (`:81-84`): `test_UAT_FC_REQ-58_surface_fill_composites_translucent_over_band` (`tests/req58-wrapper-treatments.test.ts:71`). That sibling is real and correct but **browser-gated** — `const itB = it.runIf(browserOk)` at `:32`, re-confirmed this pass — so where Chromium is absent the capture leg has no executing evidence. The remedy pattern exists inside this same story: AC-711's capture leg is proven by `test_UAT_AC711_list_marker_recorded_only_where_a_marker_is_painted` (`tests/reconciliation-capture-list-marker.test.ts:59`), which runs the real `EXTRACT_SCRIPT` under jsdom, environment-independent | Author an AC-711-style UAT for AC-631's capture leg: mount a translucent card over a tinted band, run the real `EXTRACT_SCRIPT` under jsdom, assert the captured `surfaceFill` is the blended tint, not `#ffffff` |
| 8 | warning | consistency | AC-815 `acceptance_criterion-9ccc1de8` (STORY-75) — test harness | uat-edit | Unrepaired. AC-815's only two tests use the local `itA` helper (`tests/bug27-nested-backdrop-capture.test.ts:80-84`), which on an unavailable Chromium does `if (!capture) return // Chromium unavailable — skip silently` (`:82`) — the test reports **PASS with zero assertions executed**, rather than SKIP. AC-815 is the only AC in this capability whose *entire* evidence is browser-gated this way (AC-816 uses the same helper but is backed by five browser-free `foldToL1` tests at `:213-249`; AC-817's three need no browser). The repo's own idiom elsewhere — `it.runIf(browserOk)` (`tests/req58-wrapper-treatments.test.ts:32`) — marks the test *skipped*, which is visible in the run report; the silent return is not. Distinct from finding 4: that one is about missing assertions, this one is about green evidence that may never have run | Switch `itA` to `it.runIf(browserOk)` so an absent browser shows as a skip, and/or add a browser-free leg for AC-815's clamp arithmetic in the shape of AC-816's `foldToL1` tests |
| 9 | info | — | AC-637 `acceptance_criterion-377af866` (STORY-76) | — | Correctly deprecated (`status: deprecated`, `fields.uat_coverage: deprecated`), re-read live this pass; REQ-114 retired the module-level palette-role alias and REQ-84/REQ-96 retired the resolver leg. A deprecated AC carries no uat obligation, so AC-637 is excluded from this level's coverage check. `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` (`tests/req62-gradient-panel.test.ts:69-88`) still exists and still passes — harmless. The ac-level residual noted in the last two cycles was closed by `report-11c8bf8e` | none — resolved |
| 10 | warning | coverage | AC-1605…AC-1610 (STORY-75), AC-1611/1612 (STORY-76), AC-1613…AC-1617 (STORY-77) — 13 ACs | uat-add | **The 13 `pending` ACs authored at 23:47–23:52 today by this cycle's ac-level fix carry no `test_UAT_AC<n>_*` test at all** — verified by enumeration; all 13 also carry `fields.uat_coverage: missing`, and they are the only 13 ACs in the entire 648-AC store in that state. Filed as a **warning, not a violation**, on an explicit rule: the coverage property at this level is scoped to `active` ACs, `pending` is a pre-activation lifecycle marker rather than a retirement one, and `uat_coverage` is owned by the immediately-downstream `check_uat_coverage` step, which will see all 13 by that field. **The behaviour itself is not unproven — only the matrix linkage is missing.** Every one has a working `test_UAT_FC_*` sibling: AC-1605 → `tests/bug25-multiline-run-geometry.test.ts:102-182` (5 tests); AC-1606 → `tests/bug22-split-control-surface.test.ts:109-171` (6); AC-1607 → `tests/bug16-webfont-load-before-extract.test.ts:94-186` (5); AC-1608 → `tests/bug24-scrim-alpha.test.ts:82-202` (6); AC-1609 → `tests/req63-values-diff-coverage.test.ts:412`, `:425`; AC-1610 → `…:440`; AC-1613 → `tests/req58-multi-viewport.test.ts:78-273`; AC-1614 → `tests/req63-values-diff-coverage.test.ts:289`, `:306`; AC-1615 → `…:385`; AC-1616 → `…:329`, `:361`; **AC-1611, AC-1612 and AC-1617 have no sibling under any name** — `grep -rln "REQ-72" tests/` returns nothing at all, so AC-1612's in-browser hexification of modern-colour-space gradient stops is untested outright; `tests/reconcile-gradient-first-class.test.ts` carries only AC-634/635/636/638 and no ancestor-selection test for AC-1611; and the nearest thing to AC-1617 (`tests/reconciliation-cross-gate-reconciliation.test.ts:510-513`) is the *gate's* coverage ask, a different mechanism owned by another capability. **These three are genuine authorship, not re-anchoring** | For the ten with a direct FC sibling, author a `test_UAT_AC<n>_*` test that drives the same real entry point, adding only the delta each AC's Verification asks for beyond its sibling (e.g. AC-1605's "each run of the multi-run elements carries a *distinct* extent … narrower than the shared element box" is already `test_UAT_FC_BUG-25_no_two_runs_share_a_rendered_text_box`). For AC-1611, AC-1612 and AC-1617, author from the Verification directly. Do **not** merely rename the FC tests — they are the free-coded intent's own evidence and several other capabilities cite them |
| 11 | info | — | exclusivity across all 69 active ACs | — | Re-checked this pass by enumerating every distinct `test_UAT_AC<n>_*` name for this capability's AC set. Multi-test ACs: AC-711 (diff-side `diffManifests` vs capture-side real `EXTRACT_SCRIPT` under jsdom), AC-815 (collapsed header vs off-canvas block), AC-816 (8: real-Chromium capture vs pure `foldToL1`), AC-817 (3 distinct scenarios), AC-1013 / AC-1016 (in-process `run()` vs real-binary subprocess). Newly checked: AC-1466 (preconditions executed against a real document) vs AC-1467 (both drivers import them from one definition) are different claims, not duplicates; AC-1470 (no path on the owned host escapes) vs AC-1472 (an unknown slug is answered 404 in-process) likewise. **No redundant pair found** | none |
| 12 | info | — | STORY-124 (10 ACs) + STORY-125 (7 ACs) | — | Assessed at uat level for the first time (both joined 2026-08-31, after `report-845f21a1`). Both are **aligned and substantive**, and set the standard the four violations above fall short of: AC-1461 exercises a real deployment end-to-end before asserting only the screenshot fails; AC-1469 compares the captured navigation body byte-for-byte against what the `/preview/*` route serves for the same site and channel, "fetched from the route rather than re-derived from the renderer that answered, so the comparison is a claim and not a tautology" (`tests/reconciliation-self-origin-capture.workers.test.ts:141-151`); AC-1470 asserts the escaped-to-network list is `[]` *and*, stated the other way, that every own-host request was answered (`:184-190`) so it cannot pass vacuously | none |
| 13 | warning | consistency | AC-739 `acceptance_criterion-fcf814b5` (STORY-79) | uat-edit | AC-739's Verification opens with a **scan** clause: "Scan every source file on the render graph … and confirm none names an `astro` specifier statically or dynamically, and that no `.astro` file exists in the repository." `test_UAT_AC739_astro_container_never_created_for_any_page` (`tests/reconciliation-1c-astro-free-render.test.ts:148-190`) covers the AC's other two clauses well — three real renders (L1-only, empty starter, behavior-module) plus `expectNoAstroContainerToConstruct()`, which resolves `astro/container` through `createRequire` (`tests/support/astro-absent.ts:27-30`) — but performs **no scan**. The scan evidence does exist, browser-free and unconditional, under FC names in a different file: `test_UAT_FC_REQ-148_no_astro_component_exists_anywhere` (`tests/test_UAT_FC_REQ-148_astro_free_render.test.ts:38-46`) and `test_UAT_FC_REQ-148_the_render_graph_names_no_astro_specifier` (`:48-64`). So this is a **traceability** gap, not an evidence gap — materially weaker than findings 1–4, which have no evidence anywhere. Unlike AC-631's test, which names its FC sibling in a comment, the AC-739 test does not | Either fold the two scans into the AC-739 test (they are ~15 lines and need no browser), or add an explicit cross-reference comment naming both FC tests, in the shape `reconcile-values-diff-fidelity.test.ts:81-84` already uses for AC-631 |

## Notes for the Editor

**Findings 1, 2, 5 and 6 are one cross-cutting pattern and should be fixed as one
batch.** Four ACs state a property of a *command* but are tested at an internal
seam one layer below it: AC-657/658 stop at `withCleanStdout` instead of running
the command; AC-643/639 inject a pre-made actual side instead of letting the
command render one. In each case the line that actually implements the AC
(`index.ts:769`/`:787`/`:802`/`:815`, `perceptual.ts:493`, `fidelity.ts:167`) can
be deleted with the whole capability still green. All four are fixable with
harnesses that already exist in this repo — the `spawnSync` real-binary pattern
(`…astro-free-render.test.ts:126-136`, `…launcher-bootstrap.test.ts:154`), the
in-process `runCli` (`…responsive-diff.test.ts:74-90`), and the fake-`driverFactory`
pattern (`…size-aware-diff.test.ts:312`). One batch clears two violations and two
warnings.

**For finding 1 specifically, prefer the subprocess harness over `runCli`.**
`runCli` spies on `console.log`, which observes the *arguments* to the log call,
not the stdout byte stream AC-657 is about; it would not catch a stray raw
`process.stdout.write`. AC-738's and AC-1415's `spawnSync` legs are the faithful
shape.

**Findings 4 and 8 both land on AC-815 and must be repaired together** — the
fixture needs new elements (the overflow-clipped carousel, the conventional band)
*and* the harness needs to stop passing silently when the browser is absent.
Repairing only the assertions leaves them potentially never executed.

**On the previous report's escalation.** `report-845f21a1` concluded the
downstream editor could not write to `tests/` at all, because four consecutive
cycles had left five test artifacts untouched. **That conclusion is now
disproved**: `4beb152fa2` (today, `fix_ac_validation`) added fourteen lines of
real assertions to `tests/reconciliation-size-aware-diff.test.ts`. The editor can
write to `tests/`. Note that this is the very file finding 2 names — so the
AC-643 test was open in the editor's hands this cycle and was left unchanged.
The remaining diagnosis is therefore narrower and more tractable than "the editor
is broken": these four findings are simply not being picked up as work. Two of
them (1 and 3) require a harness the file does not currently import; one (4)
requires editing an HTML fixture as well as a test. If the fix step is scoping
itself to same-file, same-shape edits, that would explain the exact set that
survives.

**A note on where this capability's evidence is strongest.** The 20 ACs added
since the last uat pass — STORY-124, STORY-125, AC-1415…1417 — are, without
exception, tested at the real boundary the AC names. They were authored by the
same pipeline that produced the four weak tests. The gap is not capability-wide
practice; it is four specific July-2026 test files that predate the current
standard and have never been revisited.
