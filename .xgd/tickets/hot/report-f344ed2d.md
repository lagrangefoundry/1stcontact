---
uid: report-f344ed2d
id: REPORT-11423
type: report
title: 'Reconciliation Review: commits (BUNDLE-40)'
created_by: xgd
created_at: '2026-11-08T12:05:53.479003+00:00'
updated_at: '2026-11-08T12:05:53.479003+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-c0301347
  anchor_uid: bundle-c0301347
  overrides_audited: 2
  trust_boundary_overrides: 0
  previous_review_uid: report-2fd5cbf5
  residual_notes:
  - AC-2412 (story-e07c589b) is status pending; its retargeted UAT test_UAT_AC2412_*
    (tests/reconciliation-material-types.workers.test.ts:273) is not in the scoped
    quality run report-8469451e and could not be executed in this review's sandbox
    (workers pool needs local port binding). The merge-gate quality run must include
    it.
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: 
**Anchor**: bundle-c0301347
**Stories Reviewed**: 7 (story-7d255580, story-58b2cec4, story-a58a0974, story-3cf3d57b, story-4cabde9a, story-39c992d3, story-d2bee21c), plus story-e07c589b for the AC-1492 replacement

This pass re-checks the one gap from the previous review (report-2fd5cbf5), re-reads the intent for all seven bundled tickets, and repeats the supersession, evidence and override checks.

Since report-2fd5cbf5 (commit 2c68a36304), two things changed: one test file (`tests/reconciliation-material-types.workers.test.ts`, 5 lines) and one new AC ticket (AC-2412, acceptance_criterion-7dcc23b9). No production code changed.

## Behavior Inventory

48 behaviours identified across seven areas: the mail text part and sender; the looking surface on the Worker and its budget; priming as configuration; the image describer session; image generation; drawing geometry; and the shared rights and provenance block now including `origin: generated`.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Derived text part with every href kept; a body with no derivable text is refused by both adapters before any network call | Covered | story-7d255580 | AC-2369, AC-2370, AC-2281 |
| 2 | Per-template `from` with MAIL_FROM as fallback and a display name; resolved once per send; read-only in the modal; a POSTed `from` is ignored | Covered | story-7d255580 | AC-2371, AC-2279, AC-2282, AC-2286 |
| 3 | Per-business looking surface, preview renderer, the deployment's own origin, capture adoption | Covered | story-58b2cec4 | AC-2372 |
| 4 | No browser: the session opens without eyes. No private bucket: no chat at all | Covered, divergence flagged | story-58b2cec4 | AC-2024 is narrowed to the code. A Reconciliation Decision records the divergence from REQ-206 |
| 5 | Forty browser acquisitions per session, counted at the lease; refusal names what ran out | Covered | story-58b2cec4 | AC-2373 |
| 6 | Screenshots reach the model as image blocks through the Toolbox on both hosts | Covered | story-58b2cec4 | AC-2031, AC-2067 |
| 7 | priming.json is the source; a malformed configuration raises PrimingConfigError at start-up naming the entry | Covered | story-a58a0974 | AC-2374 |
| 8 | One trailing cache boundary, a null provider drops its entry and separator, a 60k budget, an empty product tier | Covered | story-a58a0974, story-3cf3d57b | AC-2375, AC-2376, AC-2107, AC-2109 |
| 9 | Priming names no document by id or title; membership changes reach the session through a rebuild alone | Covered | story-3cf3d57b | AC-2377 |
| 10 | One tool-less, unprimed describer session per image, closed afterwards; the two describers are registered separately | Covered | story-4cabde9a | AC-2097, AC-2378 |
| 11 | create_image, an optional OPENAI_API_KEY, a deploy hook that never fails, aiConfigured untouched | Covered | story-39c992d3 | AC-2379, AC-2381, AC-2382, AC-2391, AC-2392 |
| 12 | The model never learns the vendor | Covered on the tool channels, divergence flagged | story-39c992d3 | AC-2380. The vendor leak into the material body is recorded as a divergence and tracked as BUG-381 |
| 13 | A material is complete from its first visible moment; scoped store handle; origin=generated shown in the Library; cap of ten | Covered | story-39c992d3 | AC-2383, AC-2390, AC-2384, AC-2386 |
| 14 | Refusal and unsupported-shape errors the model can act on; generating never changes the site | Covered | story-39c992d3 | AC-2387, AC-2388, AC-2389 |
| 15 | Anchor vocabulary, measure_drawing, relate, solve, write_image assert, refusal without a browser, the three authoring rules | Covered | story-d2bee21c | AC-2393 to AC-2408 |
| 16 | Measurement caps and the shared browser source | Covered | story-d2bee21c | AC-2410, AC-2411 |
| 17 | Shared material/reference rights and provenance block, with `origin` now including `generated` | Covered (gap closed) | story-e07c589b | AC-2412 restates AC-1492 in full with `generated` added. Its UAT is retargeted and ORIGINS now includes `generated`. tickets.ts:89 uses one MATERIAL_FIELDS for both kinds |

## Ungrounded Stories

None found.

## Supersession (Step 4c)

- AC-1492 is `superseded` by REQ-208 (request-68718201). Every clause REQ-208 did not retract is carried into AC-2412 (story-e07c589b). Its body opens: "Replaces AC-1492, whose origin vocabulary REQ-208 ... extended with `generated`. Every other clause carries over unchanged." This follows the AC-2337/AC-2409 pattern.
- AC-1692 is `superseded` (bundle-fd009b93) from an earlier bundle.
- AC-2337 is replaced by AC-2409, which is clean.
- REQ-205 states that four REQ-199 assertions pinned the invite sender to MAIL_FROM. These were retargeted in the tests, and AC-2279 was modified in place to make MAIL_FROM the fallback.
- No active AC still pins retracted behaviour. PASS.

## Evidence Sufficiency (Step 5b)

The scoped quality run report-8469451e (commit c3d9fd34, after both overrides and after the AC-2412 retarget) shows 244 passed, 0 failed, 0 skipped. It covers every active AC of the six bundle stories and story-3cf3d57b, plus 43 FC UATs for REQ-182, REQ-205, REQ-206, REQ-207, REQ-208, REQ-209 and BUG-65. Because 0 were skipped, the real-Chromium REQ-209 cases executed.

No evidence changed since report-2fd5cbf5, which spot-checked each AC's UATs against the real entry points with fakes only at external boundaries. That assessment stands.

One residual note, not a cause of failure:
- AC-2412 is `pending`, not `active`.
- Its UAT, `test_UAT_AC2412_material_and_reference_carry_the_same_six_part_rights_and_provenance_statement`, was not in the scoped run's filter.
- This review could not execute it, because the workers pool needs local port binding, which the sandbox denies (`listen EPERM 127.0.0.1`).
- Statically, the change is a rename plus `generated` added to ORIGINS. The schema accepts `generated` on both kinds. `source_url` is only required when the origin is captured or fetched, so a supplied address is accepted exactly as it already is for `uploaded` and `site`.
- The merge-gate quality run must include this UAT.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Outgoing Mail (upgrade) | story-7d255580 | ✓ (AC-2369 to AC-2371 added; AC-2279, AC-2281, AC-2282, AC-2286 modified) |
| 2. Looking surface (upgrade) | story-58b2cec4 | ✓ (AC-2372, AC-2373 added; AC-2024, AC-2031 modified) |
| 3. Session priming (upgrade) | story-a58a0974, story-3cf3d57b | ✓ (AC-2374 to AC-2377 added; AC-2107, AC-2109 modified) |
| 4. Material description (upgrade) | story-4cabde9a | ✓ (AC-2378 added; AC-2097 modified) |
| 5. Generated pictures (feature) | story-39c992d3 | ✓ (AC-2379 to AC-2392; AC-2412 under STORY-128) |
| 6. Drawing geometry (feature) | story-d2bee21c | ✓ (AC-2393 to AC-2408, AC-2410, AC-2411) |

## Mode Override Audit

2 overrides audited, 0 touched a trust boundary.

**report-483291fe** (code_frozen, imagegen.ts, rung 1): all five checklist items pass.
1. `files_touched` is the named file only.
2. The scoped run is green.
3. `vendorless()` keeps the vendor out of every tool error the model reads, as REQ-208 and AC-2380 require.
4. `vendorless()` is composed in imageSurface() at imagegen.ts:404, as the planner instructed. The declared sentence and the list of ratios survive.
5. Not touched.

**report-7519d965** (code_frozen, ai.ts, rung 2): all five checklist items pass.
1. `unnamed_files_touched` is empty. The two test-file edits fall outside what code_frozen governs.
2. The scoped run is green.
3. Passing `lib.ClaudeAPIBackend.capabilities` (ai.ts:195) is what AC-2097 and AC-2378 need for an image to be sent.
4. The in-loop conformance finding was resolved:
   - The out-of-scope REQ-146 UAT edit is reverted: `git diff main...HEAD` on that file is empty.
   - The remaining `systemText` helper is used by in-scope REQ-207, REQ-208 and REQ-182 UATs.
   - The production diff is ai.ts alone, with no added behaviour beyond what the ACs demand.
5. Not touched.

## Judgment Calls

- AC-2024, AC-2380, AC-2393 and AC-2403 are narrowed to the code. Each has a Reconciliation Decision naming the divergence from intent (BUG-381 tracks the vendor leak into the material body). These are flagged, not silently absorbed.
- REQ-208's "do not generate what the client already has; present it as a draft" is model-judgement guidance with no product instruction to assert. It is recorded as a Decision.
- REQ-182 deliberately leaves out one Role per site, the session summary and LEGACY_ROLE_NAMES deletion. REQ-207's search half is blocked upstream. None of these are planned, and that matches the intent.
- AC-2412 being pending, with its UAT outside the recorded run, is noted above rather than failed. AC-2412 is not active, the change is mechanical, the schema backs it, and the merge-gate run exercises it.

## Verdict

PASS. The stories accurately document the behaviour of the seven bundled tickets. Divergences from intent are flagged with Decisions and follow-ups rather than absorbed. The previous review's only gap, the AC-1492 replacement, is closed by AC-2412 and its retargeted UAT pinning `origin: generated` on both kinds. All six plan items produced stories, no active AC pins retracted behaviour, and both overrides pass the audit.
