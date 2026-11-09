---
uid: report-44dcbef8
id: REPORT-11648
type: report
title: 'Report: fix_plan for report-0758e7c5'
created_by: xgd
created_at: '2026-11-09T01:37:03.458352+00:00'
updated_at: '2026-11-09T01:37:03.458352+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: fix_plan
  subject_uid: report-0758e7c5
  fix_iteration: 1
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
    hypothesis: 'Two active ACs required by in-scope intents are unmet by frozen code:
      public-site/src/lead.ts buffers an undeclared-length body whole via request.arrayBuffer()
      before the 8 KiB check, and DRAWING_RASTER_NOTE in picture.ts (and its fidelity-surface.json
      copy) omits the warning that letter widths and line breaks in a drawing are
      not evidence.'
    instructions: Nothing is failing; the evidence gap is that AC-2509 (just tightened)
      and AC-2486 state REQ-223 s6 and EPIC-1 2026-09-11 intent that neither the code
      nor the tests pin. RED first. In the AC-2509 UAT, add a POST whose body has
      no content-length and is a ReadableStream that never ends (it enqueues a chunk
      on every pull), and assert 413, that the stream was cancelled, and that the
      bytes pulled are no more than MAX_BODY_BYTES plus one chunk. In the AC-2486
      UAT, assert the SVG caption says letter widths and line breaks are not evidence.
      GREEN next. In apps/public-site/src/lead.ts readFields, replace the request.arrayBuffer()
      read with a reader loop that keeps a running byte count and cancels the stream
      and returns the existing 413 as soon as the count passes MAX_BODY_BYTES; keep
      the declared-length precheck and the bytes-then-TextDecoder decode; correct
      the comment at about :243-245 so it describes the bounded read truthfully. In
      tools/generate/src/cli/picture.ts, extend DRAWING_RASTER_NOTE to say that letter
      widths and line breaks in the drawing are therefore not evidence, keeping the
      default-face and measure_drawing halves, and make the same change wherever fidelity-surface.json
      carries that caption text. Do not touch multipart handling or bounce/complaint
      suppression; those stay as divergences recorded in STORY-177. All dependency
      tests must stay green.
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
      rung1: 'Decided here: REQ-223 s6 (a large body must be rejected rather than
        read) and the EPIC-1 2026-09-11 answer on REQ-218 (the caption should say
        what is actually wrong) are in-scope intents that require the bounded read
        and the letter-widths warning.'
      rung2: 'Not reached; the reference state is the frozen code the later intent
        corrects: lead.ts:257-265 buffers the whole body and picture.ts:329-332 lacks
        the warning.'
      rung3: The tightened AC-2509 and AC-2486 UATs stand and the code changes to
        satisfy them.
    override:
      rule: code_frozen
      rung: 1
      justification: REQ-223 s6 and the EPIC-1 2026-09-11 REQ-218 answer, both in
        scope, require a body capped while it is read and a drawing caption warning
        that letter widths and line breaks are not evidence; the frozen code does
        neither, so the code is wrong and the tests are right.
      files:
      - apps/public-site/src/lead.ts
      - tools/generate/src/cli/picture.ts
      - tools/generate/src/cli/ai/fidelity-surface.json
      - tests/test_reconciliation_public_lead_capture.workers.test.ts
      - tests/reconciliation-assistant-sees-a-stored-picture.test.ts
      tip_evidence:
      - file: apps/public-site/src/lead.ts
        lines: 243-265
      - file: tools/generate/src/cli/picture.ts
        lines: 329-332
      trust_boundary: true
---

# Fix Plan — Iteration 1

## Hypothesis
No test is failing. The gate is blocked by REPORT-11646 (`blocked_by_handoff`, rule `code_frozen`), because two active ACs state intent that the frozen code does not meet. AC-2486 asks for a drawing caption saying letter widths and line breaks are not evidence. AC-2509 (after this plan's update) asks for a bounded body read. Both are required by intents in scope (rung 1), so the code changes under one scoped override.

## Analysis
- Quality evidence: REPORT-11647 (report-b7e1fd7b) shows scoped quality passing 269/269 with lint and build clean. There is no failure signature to group.
- The blocked request: REPORT-11646 lists four production-code items the fix pass (REPORT-11645 / COMMENT-8054) could not make under `code_frozen`. Each was ruled on by the ladder:
  1. **Unbounded body read.** `apps/public-site/src/lead.ts:257-265` (`request.arrayBuffer()` and then a size check). The comment at :243-245 wrongly says the read is bounded.
     - Rung 1 decides. REQ-223 §6 is in scope and says a large body "must be rejected rather than read". Acceptance 10 says it is "refused before the body is parsed".
     - **Granted.**
  2. **Drawing caption.** `DRAWING_RASTER_NOTE` (`tools/generate/src/cli/picture.ts:329-332`, and its copy in `fidelity-surface.json`) lacks the "letter widths and line breaks are not evidence" warning.
     - Rung 1 decides. EPIC-1's 2026-09-11 answer on REQ-218 is in the bundle and is the latest intent on this surface. It says: "Until it is done, the caption is load-bearing and should say what is actually wrong".
     - AC-2486 already demands the wording.
     - **Granted.**
  3. **`multipart/form-data` accepted but parsed as urlencoded** (`public-site/src/lead.ts:216` / `:281`).
     - No intent in scope mentions multipart. Every shipped form posts urlencoded (no JS) or JSON (JS).
     - Not covered by this override. It stays the recorded divergence in STORY-177, with its code issue flagged, for a follow-up ticket.
  4. **Platform-wide bounce/complaint suppression** (`control-app/src/lead.ts:288-310`).
     - This is a new cross-tenant store, not a bounded fix, and it needs an operator ruling on privacy and scope.
     - Not covered by this override. It stays the recorded per-tenant divergence in STORY-177.
- Isolation: no history of flaky or contaminating tests on this subject (first iteration).
- The two code changes are in disjoint packages (`apps/public-site` and `tools/generate`). They are kept in one batch so that one override covers the handoff and one ruling is recorded.

## Spec Changes Made
- **AC-2509 (acceptance_criterion-724e5b44), tightened.** It had been narrowed to the as-built unbounded read. Its criterion now requires a body with no declared length to be cancelled once the running byte count passes 8 KiB, never buffered whole. Its Verification adds a never-ending `ReadableStream` case that asserts a 413, cancellation, and pulled bytes no more than the cap plus one chunk. The narrowing was rung-1 wrong (REQ-223 §6).
- AC-2486: unchanged. It already states the EPIC-1 wording. Its trailing "Divergence and code issue" note goes stale once the caption lands, and the review should mark it resolved.

## Weak Evidence Flags (preventative — best effort)
- `tests/test_reconciliation_public_lead_capture.workers.test.ts::test_UAT_AC2509_malformed_submissions_are_refused_before_any_check_or_write` — weak-observation — the chunked case asserts only a 413, so a bounded read and an unbounded one cannot be told apart. This batch closes it.
- `tests/reconciliation-assistant-sees-a-stored-picture.test.ts::test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read` — weak-observation — it pins only the default-face and `measure_drawing` halves of the caption. This batch closes it.
- `tests/test_UAT_FC_REQ-223_internal_seam.test.ts` — infra-reuse-gap / FC orphan — its behaviour is now owned by AC-2513's real-entrypoint test, and it will trip the orphan gate. Rename or delete it when that gate runs.
- `tests/test_reconciliation_builder_page_carry.test.ts` (AC-2497 case) — weak-observation — the post-save reload is simulated by re-delivering the page rather than going through `onSaved` (`app.js:630`). JSDOM cannot redefine `location.reload`, so this was left as is.

## Batches
- **Batch 0** (one batch): bounded body read in `apps/public-site/src/lead.ts`, and the drawing caption in `tools/generate/src/cli/picture.ts` plus `tools/generate/src/cli/ai/fidelity-surface.json`.
  - The AC-2509 and AC-2486 UATs each gain the assertion that is red against the current code. The code is then changed to turn them green.
  - The dependency tests are every completed AC whose tests exercise the lead endpoint, the public-site doorway (AC-903..912), or the picture/fidelity surface.

## Mode overrides (REQ-892)
- Batch 0, rule `code_frozen`, rung 1.
  - Files: `apps/public-site/src/lead.ts`, `tools/generate/src/cli/picture.ts`, `tools/generate/src/cli/ai/fidelity-surface.json`, `tests/test_reconciliation_public_lead_capture.workers.test.ts`, `tests/reconciliation-assistant-sees-a-stored-picture.test.ts`.
  - Justification: REQ-223 §6 ("must be rejected rather than read") and EPIC-1's 2026-09-11 REQ-218 answer (the caption "should say what is actually wrong") are intents in scope that require exactly these changes. The frozen code is the thing that is wrong.
  - `trust_boundary` is true: `lead.ts` handles untrusted public request bodies.

## Resolution ladder (REQ-938)
- **Batch 0: rung 1 decided.**
  - REQ-223 §6 requires a large body to be rejected, not read. The reference `lead.ts:257-265` buffers the whole body with `arrayBuffer()` first.
  - The EPIC-1 2026-09-11 answer requires the caption to say letter widths and line breaks are not evidence. The reference `picture.ts:329-332` does not say it.
  - Rung 2 is not reached: the reference state is the frozen code that the later intent corrects.
  - Rung 3: the tightened AC-2509 and AC-2486 tests stand, and the code changes.
  - Multipart parsing and platform-wide suppression are not demanded by any intent in scope with a test. They remain recorded divergences in STORY-177.
