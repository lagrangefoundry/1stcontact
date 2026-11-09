---
uid: report-45273bd1
id: REPORT-12035
type: report
title: 'Report: fix_plan for story-58b2cec4'
created_by: xgd
created_at: '2026-11-09T22:13:45.661902+00:00'
updated_at: '2026-11-09T22:33:40.234079+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-58b2cec4
  fix_iteration: 13
  items:
  - index: 0
    tests:
    - a stored picture comes back as an image test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused
    - a drawing says how it was photographed, and a stored picture cannot be driven
      test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read
    - .gif and .avif site assets carry their image content types test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif
    - compare accepts a stored picture on either side test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical
    dependency_tests:
    - test_UAT_AC2483_
    - test_UAT_AC2484_
    - test_UAT_AC2487_
    - test_UAT_AC2488_
    - test_UAT_AC2564_
    - test_UAT_AC2566_
    hypothesis: The AC2485/AC2486/AC2489 UATs assert the pre-BUG-80 delivery (picture
      inline in the navigated data:text/html document), but since bf1d7bc109 the navigated
      document is the constant SHELL_DOCUMENT and the bytes arrive via chunkScript/decodeScript
      over driver.query, which the file fake browser does not record.
    instructions: 'Tests only; no production file changes. In tests/reconciliation-assistant-sees-a-stored-picture.test.ts
      the fake browser() ignores the script given to query(), so the UATs cannot see
      how bytes reach the browser and still read them out of documentOf(navigated[0])
      (lines 521, 564, 773-776, and the same stale assertion at 726 in the AC2490
      UAT). AC-2485 already states the BUG-80 contract: the navigated address does
      not carry the picture; the bytes reach the browser through its delivery channel.
      Make the harness record every query script (as tests/reconciliation-stored-picture-delivery.test.ts
      does with log.queried and deliveredChunk), then assert, for each rasterised
      picture: the navigated address is the constant shell and contains none of the
      picture base64; the delivered chunks joined equal the picture base64; and the
      decode script carries data:<media type>;base64, with the right type (image/jpeg,
      image/svg+xml, image/gif, image/avif) and never application/octet-stream. Keep
      every other assertion in these UATs (pass-through PNG, lease counts, reduction,
      decode refusal, caption, after-refusal, content types) exactly as strong as
      it is.'
    test_scope: test_UAT_AC2485_ or test_UAT_AC2486_ or test_UAT_AC2489_ or test_UAT_AC2490_
      or test_UAT_AC2483_ or test_UAT_AC2484_ or test_UAT_AC2487_ or test_UAT_AC2488_
      or test_UAT_AC2564_ or test_UAT_AC2566_
    ladder:
      rung1: 'Decides: BUG-80 is the later intent on this surface and AC-2485 was
        rewritten to it (the navigated address does not carry the picture), superseding
        REQ-218 inline delivery, so the tests change.'
      rung2: 'Agrees: reconcile-src-BUNDLE-44 screenshot.ts navigates to a constant
        SHELL_DOCUMENT and delivers bytes by chunkScript/decodeScript.'
      rung3: Not reached; the three UATs are stale against their own ACs and are corrected,
        not the code.
  - index: 1
    tests:
    - a browser failure on the stored-picture path comes back as a sentence test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released
    dependency_tests:
    - test_UAT_AC2564_
    - test_UAT_AC2566_
    - test_UAT_AC2485_
    - test_UAT_AC2486_
    - test_UAT_AC2489_
    - test_UAT_AC2487_
    - test_UAT_AC2488_
    - test_UAT_AC2027_
    - test_UAT_AC2031_
    - test_UAT_AC2032_
    - test_UAT_AC2033_
    - test_UAT_AC2034_
    - test_UAT_AC2067_
    - test_UAT_AC2478_
    - test_UAT_AC2482_
    hypothesis: rasterizeImage in tools/generate/src/cli/capture/screenshot.ts calls
      driver.screenshot (and factory()) outside its inner try/catch, so a failed shot
      escapes as the driver raw Error carrying its payload instead of a bounded ImageNotRenderableError.
    instructions: 'AC-2565 case (c) fails: a shot that rejects (Protocol error (Page.captureScreenshot)
      ... with a multi-MB payload) reaches the caller unwrapped, because in rasterizeImage
      the await driver.screenshot(...) sits in the return after the try/catch that
      applies safeDriverMessage. Bring the shot inside the same wrapped region so
      every driver failure on this path (navigate, chunk delivery, decode query, shot)
      becomes the one ImageNotRenderableError sentence naming the picture, carrying
      the sanitised driver diagnosis (its net:: code survives) and saying there is
      no picture to show; route a rejected browser lease (factory()) through the same
      bounded refusal. Do not wrap the deliberate decode refusal (size.ok false) a
      second time: its wording is asserted by AC2485. The finally that closes the
      driver must still close it on every path. Edit only screenshot.ts; screenshotAndMeasure
      and the page-shot path are out of scope.'
    test_scope: test_UAT_AC2565_ or test_UAT_AC2564_ or test_UAT_AC2566_ or test_UAT_AC2485_
      or test_UAT_AC2486_ or test_UAT_AC2489_ or test_UAT_AC2487_ or test_UAT_AC2488_
      or test_UAT_AC2027_ or test_UAT_AC2031_ or test_UAT_AC2032_ or test_UAT_AC2033_
      or test_UAT_AC2034_ or test_UAT_AC2067_ or test_UAT_AC2478_ or test_UAT_AC2482_
    override:
      rule: code_frozen
      rung: 1
      justification: BUG-80 (in scope, latest intent on this surface) and AC-2565
        require any browser failure while rasterising a stored picture, explicitly
        including taking the shot, to be a bounded picture-not-renderable refusal
        so no tool result can end the conversation; the code leaves driver.screenshot
        unwrapped, and the reference does not settle it the other way since its own
        comment on rasterizeImage states every driver interaction is wrapped.
      files:
      - tools/generate/src/cli/capture/screenshot.ts
      tip_evidence:
      - file: tools/generate/src/cli/capture/screenshot.ts
        lines: 312-315
      - file: tools/generate/src/cli/capture/screenshot.ts
        lines: 347-380
      trust_boundary: true
    ladder:
      rung1: 'Decides: BUG-80 and AC-2565 (navigating, delivering, decoding, or taking
        the shot) require the shot failure to be a bounded named refusal.'
      rung2: Reference screenshot.ts:375 leaves the shot unwrapped while its comment
        at 312-315 states every driver interaction is wrapped, so it does not decide
        against the test.
      rung3: Not reached; the AC2565 test stands and screenshot.ts changes under the
        code_frozen override.
  - index: 2
    tests:
    - a Worker-hosted consultant with a browser can see test_UAT_AC2025_the_worker_offers_the_looking_surface_and_screenshots_the_draft
    - test_UAT_AC2372_captures_are_the_businesss_own_and_drafts_come_from_our_own_origin_with_no_new_route
    - test_UAT_AC2372_capture_site_in_a_worker_turn_stores_in_the_businesss_bucket_and_adopts_it
    - test_UAT_AC2372_a_capture_that_cannot_be_adopted_is_still_stored_and_says_it_was_not_written_up
    dependency_tests:
    - test_UAT_AC2022_
    - test_UAT_AC2023_
    - test_UAT_AC2024_
    - test_UAT_AC2030_
    - test_UAT_AC2035_
    - test_UAT_AC2373_
    hypothesis: tests/global-setup-generated.ts regenerates the gitignored control-app
      generated shims only when a REQUIRED file is missing, and REQUIRED omits ai-ticketing.js
      (added by REQ-228), ai-imagegen.js and auth-passwordless.js, while the Workers
      vitest project registers no globalSetup at all, so the .workers test files fail
      to load and AC-2025/AC-2372 read as orphaned.
    instructions: 'Test infrastructure only; edit no production source. Both .workers
      test files failed collection with Cannot find module ./generated/ai-ticketing.js;
      nothing in the tests or the product is wrong. The setup that guarantees the
      generated shims exist is incomplete: REQUIRED in tests/global-setup-generated.ts
      lists six of the generated modules the control app imports statically and misses
      ai-ticketing.js, ai-imagegen.js and auth-passwordless.js, so a checkout holding
      the older shims is never regenerated; and only the node vitest project registers
      it, so a workers-only run never generates anything. Make REQUIRED cover every
      generated module the control app imports (keep it one list, derived from or
      checked against what the 1c assets build writes, so the next shim cannot be
      missed silently), and register the same globalSetup on the Workers vitest project.
      Keep using the real generator, never a stub. Prove it by deleting the generated
      ai-ticketing.js (only) and running the AC2025/AC2372 tests alone: they must
      load and pass.'
    test_scope: test_UAT_AC2025_ or test_UAT_AC2372_ or test_UAT_AC2022_ or test_UAT_AC2023_
      or test_UAT_AC2024_ or test_UAT_AC2030_ or test_UAT_AC2035_ or test_UAT_AC2373_
    ladder:
      rung1: No intent in scope addresses the test setup; REQ-228 introduced the ai-ticketing
        shim the setup does not know about.
      rung2: The reference has no tests/global-setup-generated.ts, so it shows nothing
        about the setup.
      rung3: 'Decides: the AC2025/AC2372 UATs stand and the test infrastructure that
        loads them must generate every shim the control app imports.'
  batches_pending: false
---

# Fix Plan — Iteration 13 (re-plan after validation refusal)

## Hypothesis
Three independent causes, unchanged from the refused plan REPORT-12034: (1) the AC2485/AC2486/AC2489 UATs assert the pre-BUG-80 inline delivery, while the code navigates to a constant shell and delivers the bytes over `driver.query`; (2) `rasterizeImage` in screenshot.ts takes the shot outside its wrapped region, so a failed shot escapes raw (AC-2565 case (c)); (3) the test setup that generates the gitignored control-app shims omits `ai-ticketing.js` (added by REQ-228) and is not registered on the Workers project, so the AC2025/AC2372 files never load.

## Analysis
**Why this is a re-plan.** `validate_fix_plan` refused REPORT-12034 for one reason only: "batch 2: the instructions name production files that `code_frozen` freezes in reconcile mode (apps/control-app/src/ai.ts) and the batch grants no `code_frozen` override". Batch 2 named that file only as the module whose import fails. It never asked for it to be edited. The diagnosis stands, so this plan rewords batch 2 so it names no production path. Batch 2 edits only test infrastructure: `tests/global-setup-generated.ts` and the vitest Workers project config. No override is needed or granted for it. Batches 0 and 1 are carried over unchanged; the validator raised no problem with either.

**Group 1: AC2485, AC2486, AC2489 (stale tests).** `tests/reconciliation-assistant-sees-a-stored-picture.test.ts` lines 521, 564 and 773-774 assert `src="data:image/<type>;base64,<bytes>"` inside `documentOf(navigated[0])`. Since BUG-80 (commit bf1d7bc109), the navigated document is the constant `SHELL_DOCUMENT`; `chunkScript` delivers the bytes into `window.__pic` and `decodeScript` sets `img.src = 'data:<safeMediaType>;base64,' + …`. AC-2485 was already rewritten to that contract ("the address it is navigated to does not carry the picture … bytes reached the browser through its delivery channel"). AC-2486 and AC-2489 are silent on transport. Only the tests are wrong. The file's fake browser ignores `query()` scripts. `tests/reconciliation-stored-picture-delivery.test.ts` already shows the recording pattern (`log.queried`, `deliveredChunk`). The AC2490 UAT at line 726 carries the same stale assertion and is fixed in the same edit.

**Group 2: AC2565 (code gap).** The failure is `expected Error: Protocol error (Page.captureScreenshot)… to be an instance of ImageNotRenderableError` (`reconciliation-stored-picture-delivery.test.ts:340`). In `screenshot.ts`, both in the working tree and at `reconcile-src-BUNDLE-44`, `await driver.screenshot(...)` sits in the `return` after the inner try/catch, and the browser lease is outside it too. AC-2565 names "taking the shot" explicitly. The reference's own comment on `rasterizeImage` (lines 312-315) says every driver interaction is wrapped.

**Group 3: AC2025, AC2372 (orphans: the files never loaded).** Both `.workers` test files failed collection with `Cannot find module './generated/ai-ticketing.js'`. The generated directory is gitignored and written by the `1c assets` build (`writeAiTicketingShim`, REQ-228). `tests/global-setup-generated.ts` regenerates only when a file in its REQUIRED list is missing. That list omits `ai-ticketing.js`, `ai-imagegen.js` and `auth-passwordless.js`, so a checkout holding the older shims is never refreshed. Only the node vitest project registers this setup.

**History and isolation.** The iteration-11 hypothesis (AC-2487 wording in picture.ts) is not repeated: AC2487 passes. None of these failures is cross-suite contamination. Groups 1 and 2 are deterministic assertion failures; group 3 is a missing-environment gap.

## Spec Changes Made
None. AC-2485 already states the BUG-80 delivery and AC-2565 already specifies case (c). AC-2486, AC-2489, AC-2025 and AC-2372 are correct as written.

## Weak Evidence Flags (preventative — best effort)
- tests/reconciliation-assistant-sees-a-stored-picture.test.ts test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical — drifted-assertion — line 726 asserts inline bytes in the navigated document; assert the delivered chunks instead, in batch 0's edit.
- tests/reconciliation-assistant-sees-a-stored-picture.test.ts (fake browser() harness) — weak-observation — `close()` is not counted, so no UAT in the file can prove the browser was released; count closes as the delivery test's harness does.
- tests/reconciliation-assistant-sees-a-stored-picture.test.ts (fake browser() harness) — weak-observation — `query()` ignores its script, so an implementation that never delivered bytes would still "decode"; make the size answer depend on delivered bytes.

## Batches
- **Batch 0 (tests only):** AC2485, AC2486 and AC2489, plus AC2490 in the same file. The fake browser records its query scripts. Each test asserts that the navigated address is the constant shell carrying none of the picture, that the delivered chunks join to the picture's base64, and that the decode script names the right media type.
- **Batch 1 (`code_frozen` override, screenshot.ts only):** AC2565. The shot and the lease move inside the wrapped region of `rasterizeImage`. It sits at index 1 because the review denial REPORT-6909 is keyed to batch index 0 and concerns an unrelated grant.
- **Batch 2 (test infrastructure only, no production file):** AC2025 and AC2372. Complete the REQUIRED list in `tests/global-setup-generated.ts` and register the setup on the Workers vitest project.
- **Why three batches:** each batch edits a different file set (a UAT file, `screenshot.ts`, and the test setup/config). Batches 0 and 1 both exercise `rasterizeImage`, so each lists the other's tests as dependency tests.

## Mode overrides (REQ-892)
- **Batch 1:**
  - Rule: `code_frozen`, granted at rung 1.
  - Files: `tools/generate/src/cli/capture/screenshot.ts`.
  - Justification: BUG-80 (in scope, and the latest intent on this surface) and AC-2565 ("navigating, delivering its bytes, decoding, or taking the shot") require a failed shot to come back as the bounded picture-not-renderable refusal.
  - Reference evidence (`reconcile-src-BUNDLE-44`): the shot is unwrapped at line 375 and the lease at line 347, while the comment at lines 312-315 claims every driver interaction is wrapped. So rung 2 does not decide against the test.
  - Trust boundary: true. The change governs what driver text reaches the model.

## Resolution ladder (REQ-938)
- **Batch 0, decided at rung 1:** BUG-80 supersedes REQ-218's inline delivery, and AC-2485 is already rewritten to it, so the tests change. Rung 2 agrees: the reference uses `SHELL_DOCUMENT`, `chunkScript` and `decodeScript`.
- **Batch 1, decided at rung 1:** BUG-80 and AC-2565 require the shot to be wrapped. At rung 2 the reference's stated intent (lines 312-315) matches the test. The test stands and screenshot.ts changes under the override.
- **Batch 2, decided at rung 3:** no intent addresses the test setup, and the reference has no `tests/global-setup-generated.ts`. The Worker UATs stand, and the setup that loads them must generate every shim.