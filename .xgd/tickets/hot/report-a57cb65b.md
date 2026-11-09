---
uid: report-a57cb65b
id: REPORT-11660
type: report
title: 'Report: fix_plan for report-0758e7c5'
created_by: xgd
created_at: '2026-11-09T02:16:46.671902+00:00'
updated_at: '2026-11-09T02:26:59.352814+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-0758e7c5
  fix_iteration: 2
  items:
  - index: 0
    tests:
    - tests/test_reconciliation_public_lead_capture.workers.test.ts::test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write
    - tests/reconciliation-assistant-sees-a-stored-picture.test.ts::test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read
    dependency_tests:
    - test_UAT_AC2500_
    - test_UAT_AC2501_
    - test_UAT_AC2502_
    - test_UAT_AC2503_
    - test_UAT_AC2504_
    - test_UAT_AC2505_
    - test_UAT_AC2506_
    - test_UAT_AC2507_
    - test_UAT_AC2508_
    - test_UAT_AC2510_
    - test_UAT_AC2511_
    - test_UAT_AC2512_
    - test_UAT_AC2513_
    - test_UAT_AC2514_
    - test_UAT_AC2515_
    - test_UAT_AC2516_
    - test_UAT_AC903_
    - test_UAT_AC904_
    - test_UAT_AC905_
    - test_UAT_AC906_
    - test_UAT_AC907_
    - test_UAT_AC908_
    - test_UAT_AC909_
    - test_UAT_AC911_
    - test_UAT_AC912_
    - test_UAT_AC2477_
    - test_UAT_AC2478_
    - test_UAT_AC2479_
    - test_UAT_AC2480_
    - test_UAT_AC2481_
    - test_UAT_AC2482_
    - test_UAT_AC2483_
    - test_UAT_AC2484_
    - test_UAT_AC2485_
    - test_UAT_AC2487_
    - test_UAT_AC2488_
    - test_UAT_AC2489_
    - test_UAT_AC2490_
    - test_UAT_AC2022_
    - test_UAT_AC2023_
    - test_UAT_AC2024_
    - test_UAT_AC2026_
    - test_UAT_AC2027_
    - test_UAT_AC2028_
    - test_UAT_AC2029_
    - test_UAT_AC2030_
    - test_UAT_AC2031_
    - test_UAT_AC2032_
    - test_UAT_AC2033_
    - test_UAT_AC2034_
    - test_UAT_AC2035_
    - test_UAT_AC2067_
    - test_UAT_AC2373_
    hypothesis: 'No defect remains: the iteration-1 bounded read and drawing caption
      landed in 40ae57dd34 and passed REPORT-11652 (65/65); REPORT-11659 is the no-op
      second run of that batch, filed with no proposed change.'
    instructions: 'The work this batch was granted is already committed in 40ae57dd34:
      lead.ts readFields reads through request.body.getReader() and cancels past MAX_BODY_BYTES,
      and DRAWING_RASTER_NOTE plus the fidelity-surface.json caption carry the letter-widths
      and line-breaks warning, each pinned by the AC-2509 and AC-2486 UATs. Run the
      batch scope at HEAD and confirm it is green. Make no production change; code_frozen
      applies again and nothing in scope needs it lifted. If a test in scope is red,
      report the failure output as evidence rather than editing production code.'
    test_scope: test_UAT_AC2509_ or test_UAT_AC2486_ or test_UAT_AC2500_ or test_UAT_AC2501_
      or test_UAT_AC2502_ or test_UAT_AC2503_ or test_UAT_AC2504_ or test_UAT_AC2505_
      or test_UAT_AC2506_ or test_UAT_AC2507_ or test_UAT_AC2508_ or test_UAT_AC2510_
      or test_UAT_AC2511_ or test_UAT_AC2512_ or test_UAT_AC2513_ or test_UAT_AC2514_
      or test_UAT_AC2515_ or test_UAT_AC2516_ or test_UAT_AC903_ or test_UAT_AC904_
      or test_UAT_AC905_ or test_UAT_AC906_ or test_UAT_AC907_ or test_UAT_AC908_
      or test_UAT_AC909_ or test_UAT_AC911_ or test_UAT_AC912_ or test_UAT_AC2477_
      or test_UAT_AC2478_ or test_UAT_AC2479_ or test_UAT_AC2480_ or test_UAT_AC2481_
      or test_UAT_AC2482_ or test_UAT_AC2483_ or test_UAT_AC2484_ or test_UAT_AC2485_
      or test_UAT_AC2487_ or test_UAT_AC2488_ or test_UAT_AC2489_ or test_UAT_AC2490_
      or test_UAT_AC2022_ or test_UAT_AC2023_ or test_UAT_AC2024_ or test_UAT_AC2026_
      or test_UAT_AC2027_ or test_UAT_AC2028_ or test_UAT_AC2029_ or test_UAT_AC2030_
      or test_UAT_AC2031_ or test_UAT_AC2032_ or test_UAT_AC2033_ or test_UAT_AC2034_
      or test_UAT_AC2035_ or test_UAT_AC2067_ or test_UAT_AC2373_
    ladder:
      rung1: 'Decided here: REQ-223 s6 and the EPIC-1 2026-09-11 REQ-218 answer required
        the bounded read and the caption warning, and both are satisfied at HEAD by
        40ae57dd34 (lead.ts:263-270, picture.ts:334), so no further code change is
        demanded.'
      rung2: Not needed; HEAD already matches the in-scope intents.
      rung3: The AC-2509 and AC-2486 UATs stand and pass (REPORT-11652, 65/65).
    blocked_by_ruling:
      blocked_by: code_frozen
      ruling: declined
      reason: 'Rung 1: the in-scope intents that justified lifting code_frozen were
        satisfied by the iteration-1 grant (commit 40ae57dd34, verified by REPORT-11652);
        REPORT-11659 came from a no-op second run, proposes no change, and nothing
        remaining in scope requires production code to move, so the rule stands.'
      files:
      - tests/test_reconciliation_public_lead_capture.workers.test.ts
      - tests/reconciliation-assistant-sees-a-stored-picture.test.ts
  batches_pending: false
---

# Fix Plan — Iteration 2

## Hypothesis
Nothing is left to fix. Iteration 1's granted change landed in `40ae57dd34`, and its batch check passed. REPORT-11659 is a no-op artefact: the batch ran a second time on a clean tree, the no-op guard flagged it (REPORT-11658, fingerprint unchanged), and that run filed a `code_frozen` handoff with no proposed change.

## Analysis
- **Iteration 1** (fix plan REPORT-11648): granted `code_frozen` at rung 1 for two changes.
  - The bounded body read in `apps/public-site/src/lead.ts` (REQ-223 §6).
  - The drawing caption in `tools/generate/src/cli/picture.ts` and `fidelity-surface.json` (EPIC-1, 2026-09-11).
- **What the builder did** (REPORT-11650, and the evidence in REPORT-11659): status `fixed`, commit `40ae57dd34`.
  - AC-2509 failed first (it hung on `arrayBuffer()` with a never-ending stream). AC-2486 failed first (the caption lacked the warning). Both pass now.
- **Verified at HEAD:**
  - `lead.ts:263` reads through `request.body.getReader()` and calls `reader.cancel()` at :270 once the cap is passed.
  - `picture.ts:334` and `fidelity-surface.json:200` carry the letter-widths/line-breaks warning.
- **Batch check** REPORT-11652 (01:53, after the commit): 65/65 passed across the whole batch scope.
- **Second run of the batch:** r0441 made no changes. REPORT-11658 is the no-op guard's record of that. REPORT-11659 is that run's `blocked_by` report. Its own text says there is nothing to fix and gives no proposed change.
- No hypothesis is being repeated, and there is no stuck test, no polluter, and no XGD tooling bug.
- Multipart parsing and platform-wide bounce/complaint suppression stay as divergences recorded in STORY-177, as decided in iteration 1.

## Spec Changes Made
- **AC-2486** (acceptance_criterion-ef95eeef): its out-of-date "Divergence and code issue" note is replaced with a Resolved note that cites `40ae57dd34`, REPORT-11648 and REPORT-11652. The criterion wording is unchanged.

## Weak Evidence Flags (preventative — best effort)
- `tests/test_UAT_FC_REQ-223_internal_seam.test.ts` — infra-reuse-gap / FC orphan — its behaviour is now proven by AC-2513's real-entrypoint test, so rename or delete it when the orphan gate runs.
- `tests/test_reconciliation_builder_page_carry.test.ts` (AC-2497 case) — weak-observation — the save is simulated by re-delivering the page instead of going through the real `onSaved` reload (`app.js:630`).

## Batches
- **Batch 0** (verification only, same scope as iteration 1). It confirms that AC-2509, AC-2486 and the dependency set stay green at HEAD. It edits no production file and needs no override.

## Resolution ladder (REQ-938)
- **Batch 0: decided at rung 1, and nothing further changes.**
  - The intents that required the code change (REQ-223 §6, EPIC-1 2026-09-11) are already satisfied at HEAD by `40ae57dd34`.
  - So the `code_frozen` rule stands for this iteration, and the REPORT-11659 request is **declined**: there is no change left for it to unlock.
  - Rung 2 is not needed.
  - Rung 3: the AC-2509 and AC-2486 tests stand, and they pass.