---
uid: report-02e60fe1
id: REPORT-3622
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=uat)'
created_by: xgd
created_at: '2026-09-10T01:16:16.592938+00:00'
updated_at: '2026-09-10T01:16:16.592938+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: uat
  violations: 1
  warnings: 4
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 4
**Needs review**: 0

Scope: **7 stories, 81 ACs** — 67 `active`, 13 `pending`, 1 `deprecated`. Same tree
as the previous uat pass (`report-6da4c618`, 2026-09-10 00:12, FAIL 4/6/0); nothing
joined or left the capability since.

**This is the first uat pass since the fix loop's five calls at this level**
(`report-662e2788`, `report-e2c8368a`, `report-a3f90263`, `report-6406e84b`,
`report-f2288e93`, 00:27→00:58). Every one of the previous report's thirteen
findings was re-derived against the working tree this pass, not copied forward, and
**nine of them are genuinely repaired** — including three of the four violations
that had survived five consecutive cycles. The loop's own claims were checked
against the code and, where this sandbox permitted, against an actual test run.

**What is left is one violation and four warnings, and the two long-stuck items
have the same unblocking answer**, which this cycle itself demonstrated: the repo's
`it.runIf(browserOk)` idiom. Both AC-720 and AC-1612 have been deferred across
multiple calls as "needs Chromium / needs an operator decision". Neither actually
does. Authoring a *browser-gated* leg needs no browser — it needs a test file — and
call 1 of this very loop did exactly that for AC-815. See Notes for the Editor.

**Coverage of active ACs is structurally complete**, verified by enumerating every
`test_UAT_AC<n>` name under `tests/`, `packages/`, `tools/`, `apps/` and diffing
against this capability's 81-AC set (`.xgd/tmp/dupscan.py`). Every one of the 67
active ACs carries at least one AC-named test. **AC-1612 is the only AC in the
capability — and, by the fix loop's store-wide enumeration, the only AC in the
648-AC store — with no `test_UAT_AC<n>_*` test at all.** **Exclusivity is clean**
(finding 9).

Per the level cascade, **AC bodies are the working reference.** Every quoted
Criterion / Verification string below was read from the live AC ticket this pass.
Intent was consulted only to confirm no ledger entry is retired.

## Cumulative Intent Considered

Stories record intent as *bundle* UIDs. All eight bundles touching this
capability's tree were re-read live this pass (`xgd ticket get bundle-…`) and
**every one carries `free_and_reconciled`**, so every intent below counts. **No
intent in this capability's tree carries `abandoned`, `deprecated` or `wont_fix`**
— checked, not assumed — so **Step 2.5's stale-vehicle case does not arise anywhere
in this report.**

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` (REQ-58/59/61/62) | free_and_reconciled | 2026-07-17 | `intent_uid` of STORY-75…79; `--size`, ladder, `responsive-diff`, gradient stops + panel gradient | YES |
| BUNDLE-7 `bundle-31e474b9` (REQ-63, REQ-79, REQ-82/83/84 +2) | free_and_reconciled | 2026-07-22 | Typography/effect axes (AC-711…714); aligned-crops sandbox routing (AC-720) | YES |
| BUNDLE-8 `bundle-cceaba25` (BUG-7, REQ-89/90/91/92 +5) | free_and_reconciled | 2026-07-29 | Quiet bootstrap (AC-738/739); painted-marker precondition | YES (REQ-89 superseded by REQ-150) |
| BUNDLE-10 `bundle-4ff83a8b` (BUG-12…BUG-16 +11) | free_and_reconciled | 2026-07-29 | Offline re-extract against mirrored faces (→ AC-1607) | YES |
| BUNDLE-11 `bundle-ee56a66e` (BUG-27, REQ-94/96/97/98 +10) | free_and_reconciled | 2026-08-05 | Backdrop / collapsed-subtree capture (AC-815/816/817); REQ-96 retired the resolver leg | YES |
| BUNDLE-16 `bundle-15c1f647` (REQ-44, REQ-115, REQ-117) | free_and_reconciled | 2026-08-07 | Per-command dependency preflight (AC-1013…AC-1017) | YES |
| BUNDLE-20 `bundle-b3b7c399` (REQ-143…REQ-148, REQ-150 +5) | free_and_reconciled | 2026-08-24 | Plain Vite SSR launcher; Astro out of the repo (AC-1415…1417, AC-739's rewrite) | YES (supersedes REQ-89) |
| BUNDLE-22 `bundle-8eef3846` (REQ-154 + BUG-39) | free_and_reconciled | 2026-08-31 | Cloud Browser Rendering driver behind the existing seam; self-origin fulfilment (STORY-124/125) | YES |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| **STORY-75** `story-d5de22a5` — 20 ACs (14 active, 6 pending) | BUNDLE-6, BUNDLE-7, BUNDLE-8, BUNDLE-10, BUNDLE-11 | **2 warnings, down from 1 violation + 3 warnings.** AC-631's capture leg is now real, browser-free evidence (`tests/reconciliation-capture-surface-fill.test.ts`, 3 tests driving `EXTRACT_SCRIPT` under jsdom) — old finding 7 closed. AC-815's fixture and assertions are now present and non-vacuous, and its harness skips visibly instead of passing silently — old findings 4 and 8 closed *as authored*, but nothing has ever executed them (finding 2). All six pending ACs (AC-1605…1610) now carry AC-named tests; AC-1605's Criterion/Verification disagreement is finding 4 |
| **STORY-76** `story-82eb6908` — 7 ACs (4 active, 2 pending, 1 deprecated) | BUNDLE-6 (REQ-59, REQ-62), REQ-72; retired legs: REQ-84/REQ-96 (resolver), REQ-114 (palette alias) | **1 warning.** AC-1611 gained `tests/reconciliation-surface-gradient-selection.test.ts` — 4 tests, one per clause of the selection rule, driving the real `EXTRACT_SCRIPT`; ran green here. AC-637 correctly deprecated (finding 8). **AC-1612 is the capability's one uncovered AC** (finding 3) |
| **STORY-77** `story-16f2793c` — 13 ACs (8 active, 5 pending) | BUNDLE-6 (REQ-58, REQ-61), REQ-64, REQ-76 | **aligned.** Both old gaps closed: AC-643 and AC-639 gained live-render legs (`…size-aware-diff.test.ts:418`, `:454`) that drive `cmdValuesDiff`/`cmdDiff` *without* an injected actual side and assert the seam was sized to the selected preset — the exact lines (`fidelity.ts:167`, `perceptual.ts:493`) the last report showed were deletable with the capability still green. AC-1613…1617 all gained substantive tests |
| **STORY-78** `story-2c7069fe` — 9 ACs (all active) | BUNDLE-6 (REQ-61) | **aligned — unchanged.** All nine drive `run(argv)` at the true CLI boundary via the `runCli` harness |
| **STORY-79** `story-e15a19ef` — 15 ACs (all active) | BUNDLE-6, BUNDLE-7, BUNDLE-8, BUNDLE-16, BUNDLE-20 | **1 violation, down from 2 violations + 2 warnings.** AC-657 is now measured at the byte stream — three legs spawning the real `1c` binary, including a mutant guard proving `--json` is a real branch (`…cli-output-hygiene.test.ts:120-173`); **these ran green in this sandbox**. AC-658 gained a real-binary stream-split leg. AC-739's scan clause is folded in (`…astro-free-render.test.ts:160-175`). **AC-720 is the one unrepaired gap** (finding 1) |
| **STORY-124** `story-080c6036` — 10 ACs (all active) | BUNDLE-22 (REQ-154, BUG-39) | **aligned — unchanged from last pass.** AC-1461 drives the Worker's own `fetch` against real D1/R2 before asserting only the screenshot fails; AC-1465/1466/1467 drive `runMultiStateCapture`; AC-1468 is a source-graph + manifest scan |
| **STORY-125** `story-7fa314f5` — 7 ACs (all active) | BUNDLE-22 (REQ-154, BUG-39) | **aligned — unchanged from last pass.** All seven drive the real `shotPreview` against a fake browser seam inside workerd |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-720 `acceptance_criterion-72db61ca` (STORY-79) | uat-add | **Sixth consecutive filing; the only finding from `report-6da4c618` that saw no edit at all.** `git log -1` on `tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts` still returns `087e145261` (2026-07-22). AC-720's Criterion bullet 1 and its Verification both close on an **end-to-end** observable — "a non-empty set of crop pairs is produced" / "End-to-end, `1c aligned-crops <slug> --sandbox` … emits a non-empty set of crop pairs from the sandbox build." The single test `test_UAT_AC720_sandbox_store_routing_forwarded_to_render_and_serve` (`:33-75`) covers only the pure `subRenderOptions` seam — three `expect`s on `sub.sandbox` / `sub.cwd` / `sub.source` — and the file's own docstring still concedes the rest is unautomated: "the commit's end-to-end check — 7 crop pairs from a rendered sandbox reproduction — is **manual**" (`:18-19`). The matrix advertises evidence that exists only as a one-time manual observation. This matters more than ordinary options-plumbing because the regression AC-720 exists to prevent is *defined* by crop-pair emptiness, which the seam test cannot see: `subRenderOptions` can return a perfectly-shaped object that `cmdAlignedCrops` then ignores. **Re-checked this pass, and it narrows the remedy:** `cmdAlignedCrops` has **no injectable browser seam** — it calls `playwright.chromium.launch()` directly at `tools/generate/src/cli/aligned-crops.ts:199-200`, unlike `cmdDiff`/`cmdValuesDiff` which take a `driverFactory`. So a browser-*free* end-to-end leg would require a production change, which is out of scope at uat level | **Author the browser-gated leg — this is not blocked and needs no operator decision.** Add `it.runIf(browserOk)` (`tests/req58-wrapper-treatments.test.ts:32`; and now `tests/bug27-nested-backdrop-capture.test.ts:92`, applied by this same loop's call 1) driving `cmdAlignedCrops` against a sandbox reproduction with matching anchors, asserting a non-empty `areas` set and that the ref/ours PNG pairs exist on disk. Writing a browser-gated test does not require a browser — it requires the test to *exist*, so the matrix stops advertising a manual check and the evidence executes wherever Chromium does. The `ac-edit` branch (dropping the end-to-end clause) is the fallback only if the operator rules the pipeline permanently unautomatable — do not treat the choice as a precondition for acting |
| 2 | warning | consistency | AC-815 `acceptance_criterion-9ccc1de8` (STORY-75) | — (escalate: runner) | **Downgraded from violation — the authoring gap is genuinely closed.** `tests/fixtures/capture/bug27-nested-backdrop.html` now carries both missing shapes (`.carousel { position: relative; overflow: hidden }` with a 3000px track at `:67-69`, and the conventional band at `:119`), and two new tests assert them: `test_UAT_AC815_overflow_clipped_carousel_band_is_clamped_to_the_document` (`:150-170`) and `test_UAT_AC815_conventional_band_box_is_unchanged_from_its_border_box` (`:172-184`). The carousel assertion is stated against the *unclamped* value (`expect(widest).toBeLessThan(3000)`, `:169`) so it cannot pass vacuously — it is the `Math.min(docW, …)` clamp at `extract.ts:499`, in the direction the off-canvas case cannot stand in for. Old finding 8 is closed too: `itA` is now `it.runIf(browserOk)` (`:92`), so an absent browser shows as SKIPPED rather than as a green tick over zero assertions. **What remains is not an authoring defect but an execution one:** no runner that has touched this capability has had Chromium, so all four AC-815 tests have *never executed*, and their expected values (e.g. `Math.round(plain!.box.height)).toBe(200)`) are derived from the fixture and the AC text rather than observed. `AC-815.uat_coverage` is correctly still `fail` | No matrix or test edit. **Run this capability's suite once on a host with Chromium** and correct whatever the four AC-815 tests report. That single change also unblocks finding 3's browser half and finding 1's new leg |
| 3 | warning | coverage | AC-1612 `acceptance_criterion-142808b6` (STORY-76) | uat-add | **The capability's only AC with no `test_UAT_AC<n>_*` test** — verified by enumeration this pass; `uat_coverage: missing`, the one such AC in the store. Twelve of the thirteen `pending` ACs authored at the ac-level fix were closed across the five fix calls; this is the thirteenth. Filed as a **warning, not a violation**, on the same explicit rule the last two passes used: the coverage property at this level is scoped to `active` ACs, `pending` is a pre-activation lifecycle marker rather than a retirement one, and `uat_coverage` is owned by the immediately-downstream `check_uat_coverage` step, which will see this AC by that field. **But the standing justification for deferring it is refuted.** `report-f2288e93` argues AC-1612 "is not authorable browser-free" because its Criterion requires stops "resolved to `#rrggbb` **in-browser**… rather than colour-space maths reimplemented in the tool", and jsdom cannot resolve `oklch(...)`. That is an argument against a *jsdom* test, not against a test: the repo's answer to "this clause needs a real browser" is `it.runIf(browserOk)`, which call 1 of this same loop applied to AC-815. Nothing about writing that file requires a browser to be present | Author `tests/…-gradient-modern-colour-stops.test.ts` with `it.runIf(browserOk)` legs driving the real capture over a fixture carrying a surface gradient and a `background-clip: text` gradient authored in `oklch(...)` / `color-mix(...)`: assert each stop list is non-empty, in painted order, every stop a `#rrggbb` literal; assert the visually-identical `#hex` fixture captures stop-for-stop identically; then diff a reproduction with one differing stop and assert a gradient delta on each kind. If any clause is measurable browser-free, split it out ungated — but do not leave the AC with no test on the ground that the browser half cannot run here |
| 4 | warning | consistency | AC-1610 `acceptance_criterion-4a491cfa` (STORY-75) | ac-edit | AC-1610's Verification closes "…assert **exactly one delta** is reported, on the `gap` axis", which is not satisfiable as written: shifting a row so the measured gap differs also moves that element absolutely, firing an independent `position` delta (repair class B). The AC's **Criterion** speaks only about band padding versus the gap axis and is fully satisfiable. `test_UAT_AC1610_identical_band_padding_with_a_shifted_row_reports_the_gap_axis` (`tests/reconciliation-values-diff-spacing-axes.test.ts:139-171`) asserts the Criterion — `spacingAxes.map(x => x.property)).toEqual(['gap'])` plus no band-padding delta on any section — and documents the divergence inline at the assertion (`:163-169`) rather than quietly asserting less. That is the correct handling at this level; the residue is an AC-body defect. Found by the fix step, confirmed here against the AC ticket and the test | At the next **ac-level** pass, change the Verification's last sentence to "assert the vertical-spacing signal reported is the `gap` axis, and that no band-padding delta is emitted on any section". No behaviour change is implied — only the wording overreaches. Not actionable at level=uat |
| 5 | warning | consistency | AC-1605 `acceptance_criterion-e7641019` (STORY-75) | ac-edit | Same shape as finding 4, on the nested-span case. AC-1605's Verification asks that "each run of the multi-run elements carries a *distinct* extent matching that run's own **text-node** rect — differing from its siblings' and **narrower than the shared element box**". For the `<br>`-broken paragraph that holds. For "a heading with a nested span" it does not: the outer heading and the inner span each own exactly one run, so by the Criterion's own first sentence ("An element contributes its own rendered text box only when it owns *exactly one* text run") each is measured off its **own element box**, not off a text node, and neither is narrower than a shared box because there is no shared box to be narrower than. `test_UAT_AC1605_a_nested_span_gives_each_owner_its_own_extent` (`tests/reconciliation-per-run-text-extent.test.ts:136-163`) asserts the Criterion and flags the disagreement in the file header (`:27-29`). The other three legs, including the AC's closing one-line-difference clause, are satisfied exactly as written | At the next **ac-level** pass, qualify the Verification's nested-span clause — e.g. "…and for the nested-span shape assert each owner carries its own distinct extent" — so it stops asking for a text-node rect where the Criterion assigns an element box. Not actionable at level=uat |
| 6 | info | — | Findings 1, 2, 5, 6, 7, 8 and 13 of `report-6da4c618` | — | **Verified repaired against the working tree, not taken on the fix loop's word.** AC-657: `tests/reconciliation-1c-cli-output-hygiene.test.ts` now imports `spawnSync` (`:2`) and three legs run the real binary and parse its whole stdout (`:120`, `:148`, `:164`) — including a guard leg proving the human report is *not* JSON, so a mutant emitting the document unconditionally cannot pass all three. AC-658 gained a real-binary stream-split leg (`:179`). AC-643/AC-639 gained live-render legs asserting `driver.shotViewport` / `driver.navigatedViewport` (`…size-aware-diff.test.ts:444`, `:487`). AC-631's capture leg is a new browser-free file. AC-815's harness is `it.runIf`. AC-739's scan clause is folded in. **Executed here where the sandbox allowed: the AC-657/658/659/656 suite ran green (real `1c` subprocesses and all), as did the seven new browser-free files (40 tests, 0 failures)** | none — resolved |
| 7 | info | — | this runner's sandbox | — | **Five legs could not be executed in this assessment and this is the runner, not the tests.** `tests/reconciliation-size-aware-diff.test.ts:418`/`:454` and three of the four AC-1607 legs in `tests/reconciliation-offline-reextract-mirror.test.ts` die with `EPERM: operation not permitted` from `Server.listen` (on both `0.0.0.0` and `127.0.0.1`). The control: `tests/req113-serve-extensionless.test.ts` — untouched since long before this cycle, unrelated to this capability — fails identically here, and `report-662e2788` / `report-f2288e93` report these same files green 90 minutes ago from the fix role. Socket binding is denied to this session, not broken in the code. **No finding is filed on those five legs**, and a future assessor seeing EPERM should reach the same conclusion rather than re-filing them as defects | none |
| 8 | info | — | AC-637 `acceptance_criterion-377af866` (STORY-76) | — | Correctly deprecated (`status: deprecated`, `uat_coverage: deprecated`), re-read live; REQ-114 retired the module-level palette-role alias and REQ-84/REQ-96 retired the resolver leg. A deprecated AC carries no uat obligation, so AC-637 is excluded from this level's coverage check. `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` still exists and still passes — harmless | none |
| 9 | info | — | exclusivity across all 67 active + 13 pending ACs | — | Re-checked by enumerating every distinct `test_UAT_AC<n>_*` name for this capability's AC set and grouping by file. **Only two ACs are tested across more than one file, and both are deliberate leg splits, not duplicates**: AC-631 (`reconcile-values-diff-fidelity` = the compare leg; `reconciliation-capture-surface-fill` = the capture leg) and AC-711 (`reconcile-values-diff-treatments` = diff-side `diffManifests`; `reconciliation-capture-list-marker` = capture-side `EXTRACT_SCRIPT`). Within-file multi-test ACs (AC-815×4, AC-816×8, AC-817×3, AC-657×3, AC-1605/1606/1607/1608/1611×4-5, AC-1613×4, AC-1614×4) each cover distinct clauses of their AC's Verification. **No redundant pair found.** The nine new files also each state, in their header, which FC siblings they do *not* duplicate and what clause they add | none |
| 10 | info | — | AC-1607 `acceptance_criterion-364de809` (STORY-75) | — | Partial by design and honestly declared. `tests/reconciliation-offline-reextract-mirror.test.ts` drives the real `reextractFromBundle` and closes the **serving** half — the rewritten document, `css2` served as `text/css` with its inner `@font-face` src rewritten, the mirrored bytes reachable at the rewritten path, a nothing-mirrored bundle served byte-identical. The Verification's remaining clauses (`fontLoaded: true`, the captured family being the intended face, glyph extents matching an online extract) are properties of a real font-loading browser and stay with the browser-gated `test_UAT_FC_BUG-16_reextract_serves_mirrored_crossorigin_webfont`. The scope limit is stated in the file header (`:32-37`) rather than implied, which is the standard the rest of the capability should be held to | none |

## Notes for the Editor

**The two remaining items are not blocked, and this cycle proved it.** AC-720
(finding 1) and AC-1612 (finding 3) have been carried across five fix calls as
"needs Chromium, or an operator decision". Call 1 of this same loop closed AC-815's
authoring gap by writing a fixture and four assertions it could not execute, and by
switching the harness to `it.runIf(browserOk)` so the absence shows as SKIPPED. That
is exactly the move both remaining items need. **Authoring a browser-gated test does
not require a browser.** What it buys is that the matrix stops claiming evidence it
does not have, and that the evidence runs the moment a Chromium-capable runner does.
Neither needs an operator to choose anything first; the `ac-edit` fallback on AC-720
remains available if the operator later rules the crop pipeline permanently manual.

**One escalation, unchanged and now the sole environmental blocker: can this loop
run on a host with Chromium?** Findings 2 and 3 both resolve to it, finding 1's new
leg would too, and `report-662e2788` asked the same question two calls ago. Eleven
browser-gated tests skip on every run. Until then AC-815's four assertions remain
authored-but-unobserved and cannot be confirmed correct by anyone.

**Do not re-file the EPERM failures (finding 7).** A `listen(2)` denial in the
assessor's sandbox makes two size-aware-diff legs and three AC-1607 legs error out.
They are sound tests; a pre-existing unrelated suite fails the same way here, and the
fix role reported them green from the same commit. Anyone re-running this check under
a different sandbox should expect a different failure list for reasons that have
nothing to do with the matrix.

**Two AC-body defects are queued for the next ac-level pass, not for you** (findings
4 and 5). Both were found while authoring tests, both are Verification sentences that
overreach their own Criterion, and in both cases the test asserts the Criterion and
documents the divergence inline. That is the right outcome at this level — do not
"fix" the tests to match the overreaching Verification text.

**On the previous report's diagnosis, now closed.** `report-845f21a1` (August)
concluded the downstream editor could not write to `tests/` at all;
`report-6da4c618` narrowed that to "the fix step is scoping itself to same-file,
same-shape edits". Both are now disproved: this loop imported `spawnSync` into a
file that lacked it, authored nine new test files, and edited an HTML fixture. The
capability went from four violations to one in five calls. The residual is a single
test file untouched since 2026-07-22 and one AC that has never had a test.
