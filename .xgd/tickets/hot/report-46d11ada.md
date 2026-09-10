---
uid: report-46d11ada
id: REPORT-3631
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=uat)'
created_by: xgd
created_at: '2026-09-10T01:41:14.576110+00:00'
updated_at: '2026-09-10T01:41:14.576110+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: uat
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 3
**Needs review**: 0

Scope: **7 stories, 81 ACs** — 67 `active`, 13 `pending`, 1 `deprecated`. Unchanged
tree since `report-02e60fe1` (2026-09-10 01:16, FAIL 1/4/0); nothing joined or left
the capability.

This is the first uat pass since **fix attempt 8** (`report-eb125804`, 01:27). That
call claimed to close both remaining actionable findings — the violation on AC-720
and the coverage warning on AC-1612. **Both claims were re-derived here against the
working tree and an actual test run, not accepted on the fix report's word, and both
are genuinely closed.** The capability has no violation and nothing needing review,
so it passes.

What remains is **three warnings, none of them a matrix or test defect that this
level can repair**: one environmental execution escalation (the same one the last
three passes have raised, now with a measured scope) and two AC-body wording defects
already queued for the next ac-level pass.

Per the level cascade, **AC bodies are the working reference.** Every Criterion /
Verification string quoted below was read from the live AC ticket this pass. Intent
was consulted only to confirm no ledger entry is retired — none is.

## Cumulative Intent Considered

All eight bundles touching this capability's tree carry `free_and_reconciled`, so
every intent below counts. **No intent in this capability's tree carries `abandoned`,
`deprecated` or `wont_fix`** — so **Step 2.5's stale-vehicle case does not arise
anywhere in this report.** Ledger carried forward from `report-02e60fe1`, which
re-read every bundle live; spot-confirmed unchanged this pass.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` (REQ-58/59/61/62) | free_and_reconciled | 2026-07-17 | `intent_uid` of STORY-75…79; `--size`, ladder, `responsive-diff`, gradient stops + panel gradient | YES |
| BUNDLE-7 `bundle-31e474b9` (REQ-63, REQ-79, REQ-82/83/84 +2) | free_and_reconciled | 2026-07-22 | Typography/effect axes (AC-711…714); aligned-crops sandbox routing (AC-720) | YES |
| BUNDLE-8 `bundle-cceaba25` (BUG-7, REQ-89/90/91/92 +5) | free_and_reconciled | 2026-07-29 | Quiet bootstrap (AC-738/739); painted-marker precondition | YES (REQ-89 superseded by REQ-150) |
| BUNDLE-10 `bundle-4ff83a8b` (BUG-12…BUG-16 +11) | free_and_reconciled | 2026-07-29 | Offline re-extract against mirrored faces (AC-1607) | YES |
| BUNDLE-11 `bundle-ee56a66e` (BUG-27, REQ-94/96/97/98 +10) | free_and_reconciled | 2026-08-05 | Backdrop / collapsed-subtree capture (AC-815/816/817); REQ-96 retired the resolver leg | YES |
| BUNDLE-16 `bundle-15c1f647` (REQ-44, REQ-115, REQ-117) | free_and_reconciled | 2026-08-07 | Per-command dependency preflight (AC-1013…AC-1017) | YES |
| BUNDLE-20 `bundle-b3b7c399` (REQ-143…REQ-148, REQ-150 +5) | free_and_reconciled | 2026-08-24 | Plain Vite SSR launcher; Astro out of the repo (AC-1415…1417, AC-739) | YES (supersedes REQ-89) |
| BUNDLE-22 `bundle-8eef3846` (REQ-154 + BUG-39) | free_and_reconciled | 2026-08-31 | Cloud Browser Rendering driver behind the existing seam; self-origin fulfilment (STORY-124/125) | YES |

## Coverage — re-enumerated independently

Coverage was re-derived from scratch this pass with a binary-safe walk of `tests/`,
`packages/`, `tools/` and `apps/` (`.xgd/tmp/uatscan.py` — byte-mode read, because
two files in this repo carry NUL bytes and are invisible to a plain text grep),
extracting every `test_UAT_AC<n>_*` name and diffing against this capability's
81-AC set.

**Result: zero gaps.** All **67 active ACs** carry at least one AC-named test, and so
do all **13 pending ACs** — including AC-1612, which the previous pass recorded as the
only AC in the entire 648-AC store with no test at all. The deprecated AC-637 is
excluded from the obligation.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| **STORY-75** `story-d5de22a5` — 20 ACs (14 active, 6 pending) | BUNDLE-6, 7, 8, 10, 11 | **aligned, with 2 carried warnings.** All 20 ACs carry tests. Ran the story's eleven node-side files here: **10 files / 52 tests pass**, 10 skipped (browser-gated), 3 errored on `listen(2)` EPERM (warning 1 / finding 4). AC-815's four assertions remain authored-but-unobserved. AC-1605 and AC-1610 carry AC-body wording defects (warnings 2 and 3) which their tests correctly assert *around* |
| **STORY-76** `story-82eb6908` — 7 ACs (4 active, 2 pending, 1 deprecated) | BUNDLE-6 (REQ-59, REQ-62), REQ-72; retired legs REQ-84/96, REQ-114 | **aligned — the previous pass's one coverage gap is closed.** AC-1612 now has `tests/reconciliation-gradient-modern-colour-stops.test.ts` with both fixtures; verified substantive below. AC-637 correctly deprecated (finding 2) |
| **STORY-77** `story-16f2793c` — 13 ACs (8 active, 5 pending) | BUNDLE-6 (REQ-58, REQ-61), REQ-64, REQ-76 | **aligned — unchanged.** 48 tests pass here across its files; the two AC-639/AC-643 live-render legs error on `listen(2)` EPERM, which is the sandbox (finding 4) |
| **STORY-78** `story-2c7069fe` — 9 ACs (all active) | BUNDLE-6 (REQ-61) | **aligned — unchanged.** All nine drive `run(argv)` at the true CLI boundary via the `runCli` harness; all pass here |
| **STORY-79** `story-e15a19ef` — 15 ACs (all active) | BUNDLE-6, 7, 8, 16, 20 | **aligned — the previous pass's sole violation is closed.** AC-720 now carries the end-to-end leg (verified below). Ran all five of the story's files: **5 files / 23 tests pass, 0 failures.** AC-1017 verified to pin the gated verb set *entire*, as the capability body requires |
| **STORY-124** `story-080c6036` — 10 ACs (all active) | BUNDLE-22 | **aligned — unchanged.** All ten carry tests. Its two `.workers.` files cannot be executed in this sandbox at all (miniflare needs to bind a socket) — finding 4, not a defect |
| **STORY-125** `story-7fa314f5` — 7 ACs (all active) | BUNDLE-22 | **aligned — unchanged.** All seven drive the real `shotPreview` against a fake browser seam inside workerd; unexecutable here for the same binding reason |

## Verification of fix attempt 8 — done against the tree, not the report

**AC-720 `acceptance_criterion-72db61ca` — the six-times-filed violation is closed.**
`tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts` now carries Part B,
`test_UAT_AC720_sandbox_reproduction_emits_a_non_empty_set_of_crop_pairs` (`:205-243`),
an `it.runIf(browserOk)` leg that drives the real `cmdRepro('tastingmenu', { cwd, ref,
sandbox: true })` → real `cmdAlignedCrops({ sandbox: true, … })` chain against a
reference bundle built locally (`writeL1` + a 1280px `rest` projection in
`multistate.json` + a real `sharp`-generated 1280×1200 `screenshot-1280.png`, sized so
`cropTo` cannot silently skip). It asserts exactly the observable the seam test
structurally could not see — `expect(areas.length).toBeGreaterThan(0)` (`:231`), the
anchor present in the returned areas, and **both** `-ref.png` and `-ours.png` on disk
for every area (`:236-239`). It also pins the routing directly: the repro lands under
`storage/sandbox/` and `storage/sites/tastingmenu` does **not** exist (`:213-216`).
The docstring concession the last six reports quoted — "the commit's end-to-end check
… is **manual**" — is gone, replaced by an explicit Part A / Part B split stating why
B must be gated (`cmdAlignedCrops` calls `playwright.chromium.launch()` directly at
`aligned-crops.ts:199-200` and has no injectable driver seam). The matrix no longer
advertises a one-time manual observation.

**AC-1612 `acceptance_criterion-142808b6` — the coverage gap is closed.**
`tests/reconciliation-gradient-modern-colour-stops.test.ts` (189 lines) plus fixtures
`tests/fixtures/capture/gradient-modern-stops.html` and `…-drift.html` (both present
on disk) carry three `it.runIf(browserOk)` legs that map **one-to-one onto the AC's
three Verification clauses**: non-empty ordered hex stop lists asserted per gradient
*kind* (surface and `background-clip: text` travel different code paths), modern-vs-
`#hex` stop-for-stop agreement with the hex twin independently pinned so the pair
cannot agree by both being empty, and a real capture→diff pass asserting a delta on
each kind plus a no-false-delta control on the four unchanged runs. The assertions are
non-vacuous in the direction the defect lies: `expect(grad!.stops.length).toBe(2)` is
the pre-fix empty list, and painted order is asserted by channel dominance rather than
exact bytes.

**Both files were executed here**, not merely read:
`npm test -- tests/reconciliation-gradient-modern-colour-stops.test.ts tests/reconciliation-1c-aligned-crops-sandbox-routing.test.ts`
→ **1 passed, 4 skipped, 0 failed.** Both compile, every import resolves, and the four
browser-gated legs report SKIPPED rather than green-over-zero-assertions.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-815, AC-720, AC-1612 + STORY-124/125 (17 ACs) | — (escalate: runner) | **The standing execution escalation, now with measured scope — and it is wider than "AC-815's four assertions".** No runner that has touched this capability has been able to execute: (a) the **15 browser-gated legs** (AC-815×4, AC-720 Part B, AC-1612×3, and the pre-existing FC legs), because `chromiumAvailable()` is `false` here for two hard named reasons — the macOS seatbelt profile denies Chromium's Mach bootstrap port (`bootstrap_check_in … Permission denied (1100)` → SIGTRAP) and the cache holds build 1234 while `playwright@1.61.1` pins 1228, with an empty network allowlist and `npx` denied; or (b) **the whole of STORY-124 and STORY-125 — 17 active ACs**, because their `.workers.` suites need miniflare to bind a socket and `listen(2)` is denied to this session (the run dies before any test executes). These tests are correctly authored and correctly skipping/erroring; the assertions in them are derived from fixtures and AC text rather than observed. **No test or matrix edit can discharge this** | None here. **Run this capability's suite once on a host with Chromium and socket-binding permission**, then correct whatever those 15 legs and 17 workers ACs report. This is the only action that converts the capability's authored evidence into observed evidence, and it is an operator/runner action |
| 2 | warning | consistency | AC-1610 `acceptance_criterion-4a491cfa` (STORY-75) | ac-edit | **Carried forward unrepaired by design, and confirmed still present** (AC body re-read live this pass). The Verification closes "…assert **exactly one delta** is reported, on the `gap` axis", which is not satisfiable as written: shifting a row so the measured gap differs also moves that element absolutely, firing an independent `position` delta. The **Criterion** speaks only about band padding versus the gap axis and is fully satisfiable. `test_UAT_AC1610_identical_band_padding_with_a_shifted_row_reports_the_gap_axis` (`tests/reconciliation-values-diff-spacing-axes.test.ts:139-171`) asserts the Criterion and documents the divergence inline rather than quietly asserting less — the correct handling at this level. The residue is an AC-body defect | At the next **ac-level** pass, change the Verification's last sentence to "assert the vertical-spacing signal reported is the `gap` axis, and that no band-padding delta is emitted on any section". No behaviour change implied. **Not actionable at level=uat — do not edit the test to chase the overreaching wording** |
| 3 | warning | consistency | AC-1605 `acceptance_criterion-e7641019` (STORY-75) | ac-edit | **Carried forward unrepaired by design, and confirmed still present.** The Verification asks that each run of the multi-run elements carry "a *distinct* extent matching that run's own **text-node** rect — … **narrower than the shared element box**". True for the `<br>`-broken paragraph; false for "a heading with a nested span", where the outer heading and the inner span each own exactly one run, so by the Criterion's own first sentence each is measured off its **own element box** — and there is no shared box to be narrower than. `test_UAT_AC1605_a_nested_span_gives_each_owner_its_own_extent` (`tests/reconciliation-per-run-text-extent.test.ts:136-163`) asserts the Criterion and flags the disagreement in the file header. The other legs satisfy the AC as written | At the next **ac-level** pass, qualify the nested-span clause — e.g. "…and for the nested-span shape assert each owner carries its own distinct extent" — so it stops asking for a text-node rect where the Criterion assigns an element box. **Not actionable at level=uat** |
| 4 | info | — | this runner's sandbox | — | **Do not re-file these as defects.** Executing the capability's node-side suite here produced 5 errors, all `EPERM: operation not permitted` from `Server.listen` (on both `0.0.0.0` and `127.0.0.1`): 3 AC-1607 legs in `tests/reconciliation-offline-reextract-mirror.test.ts` and the 2 AC-639/AC-643 live-render legs in `tests/reconciliation-size-aware-diff.test.ts:473`. The three `.workers.` files die the same way before running a test. Socket binding is denied to this session — the previous assessor recorded an unrelated pre-existing suite failing identically, and the fix role reported these same files green from the same commit. Aggregate where the sandbox allowed: **22 files / 123 tests pass, 0 genuine failures, 12 skipped** | none |
| 5 | info | — | exclusivity across all 80 non-deprecated ACs | — | **Clean — re-derived, and one apparent duplicate was run down and dismissed.** The enumeration flagged `test_UAT_AC631_surface_fill_is_composited_alpha_colour` as appearing in two files; reading both shows the second occurrence is a **docstring cross-reference** in `tests/reconciliation-capture-surface-fill.test.ts:15`, not a second test of that name. The only ACs genuinely tested across more than one file are AC-631 and AC-711, and both are deliberate leg splits (compare-side `diffManifests` vs capture-side `EXTRACT_SCRIPT`) rather than duplicates. Multi-test ACs within a file each cover distinct Verification clauses. **No redundant pair found** | none |
| 6 | info | — | AC-637 `acceptance_criterion-377af866` (STORY-76) | — | Correctly deprecated; excluded from this level's coverage obligation. `test_UAT_AC637_surface_gradient_resolves_absolute_or_overlay` (`tests/req62-gradient-panel.test.ts:69-88`) still exists and still passes. **Harmless, and on inspection not even stale**: it drives `resolveSurfaceGradient`, which the capability's Scope explicitly *retains* ("the legacy module content-field gradient and its shared `resolveSurfaceGradient` resolver"). Only the AC label is retired, not the code under test | none |
| 7 | info | — | capability body, cluster-2 "recorded defect" note | — | That note says STORY-124's Technical Context "says 'Filed under CAP-102 (1c Capture & Diff Fidelity)' … and will keep surfacing until a step permitted to edit story content corrects it to CAP-63". **Read live this pass, `story-080c6036` now reads "Filed under CAP-63 (1c Capture & Diff Fidelity),"** — so the defect is repaired and the capability body's note about it is now itself the stale artifact. Recorded, not actioned: editing a capability body is outside this level's remit | none (forward to a story/capability-level step) |

## Notes for the Editor

**There is nothing for a uat-level fix step to do.** All three warnings are
explicitly out of this level's reach: warning 1 needs a different *runner*, and
warnings 2 and 3 are AC-body edits the previous pass already queued for the next
**ac-level** cycle with an instruction not to "fix" the tests to match the
overreaching text. That instruction still stands — both tests assert their AC's
Criterion correctly and document the divergence inline, which is the right shape.
Rewriting them to chase the Verification wording would make the evidence worse.

**The fix loop's two closures are real.** After eight attempts it is worth stating
plainly: attempt 8's claims were checked against the working tree *and* executed, and
AC-720's end-to-end leg and AC-1612's three legs are substantive, non-vacuous, and
correctly gated. The insight that unstuck both — **authoring a browser-gated test does
not require a browser** — is worth carrying forward to any future capability that
stalls on "needs Chromium".

**The execution gap is now the capability's only real risk, and it is bigger than
previous passes recorded.** Earlier reports framed it as "AC-815's four assertions".
Measured this pass, it is 15 browser-gated legs *plus* every AC on STORY-124 and
STORY-125 — 17 active ACs whose suites cannot start at all under a `listen(2)` denial.
That is roughly a quarter of the capability's active ACs carrying authored-but-never-
observed evidence. The matrix is now honest about this (those ACs carry
`uat_coverage: fail`, not `pass`, and nothing claims a green it has not seen), which
is why this is a warning and not a violation — but a single run on a permissive host
would retire more risk here than any further matrix work.

**A future assessor seeing a different failure list should suspect the sandbox first.**
Finding 4's EPERM set and the Chromium skips are environment-shaped, and the failure
list will change between hosts for reasons that have nothing to do with this matrix.
