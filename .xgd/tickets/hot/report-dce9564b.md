---
uid: report-dce9564b
id: REPORT-12034
type: report
title: 'Report: fix_plan for story-58b2cec4'
created_by: xgd
created_at: '2026-11-09T22:05:37.452347+00:00'
updated_at: '2026-11-09T22:05:37.452347+00:00'
completed_at: null
last_field_updated: created_at
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
      over driver.query, which the file's fake browser does not record.
    instructions: 'Tests only; no production file changes. In tests/reconciliation-assistant-sees-a-stored-picture.test.ts
      the fake browser() ignores the script given to query(), so the UATs cannot see
      how bytes reach the browser and still read them out of documentOf(navigated[0])
      (lines 521, 564, 773-776, and the same stale assertion at 726 in the AC2490
      UAT). AC-2485 already states the BUG-80 contract: the navigated address does
      not carry the picture; the bytes reach the browser through its delivery channel.
      Make the harness record every query script (as tests/reconciliation-stored-picture-delivery.test.ts
      does with log.queried and deliveredChunk), then assert, for each rasterised
      picture: the navigated address is the constant shell and contains none of the
      picture''s base64; the delivered chunks joined equal the picture''s base64;
      and the decode script carries data:<media type>;base64, with the right type
      (image/jpeg, image/svg+xml, image/gif, image/avif) and never application/octet-stream.
      Keep every other assertion in these UATs (pass-through PNG, lease counts, reduction,
      decode refusal, caption, after-refusal, content types) exactly as strong as
      it is.'
    test_scope: test_UAT_AC2485_ or test_UAT_AC2486_ or test_UAT_AC2489_ or test_UAT_AC2490_
      or test_UAT_AC2483_ or test_UAT_AC2484_ or test_UAT_AC2487_ or test_UAT_AC2488_
      or test_UAT_AC2564_ or test_UAT_AC2566_
    ladder:
      rung1: 'Decides: BUG-80 is the later intent on this surface and AC-2485 was
        rewritten to it (the navigated address does not carry the picture), superseding
        REQ-218''s inline delivery, so the tests change.'
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
      escapes as the driver's raw Error carrying its payload instead of a bounded
      ImageNotRenderableError.
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
      shims only when a REQUIRED file is missing, and REQUIRED omits ai-ticketing.js
      (added by REQ-228), ai-imagegen and auth-passwordless, while vitest.workers.config.mts
      registers no globalSetup at all, so the .workers files that import ai.ts fail
      to load and AC-2025/AC-2372 read as orphaned.
    instructions: 'Both .workers files failed collection with Cannot find module ./generated/ai-ticketing.js
      imported from apps/control-app/src/ai.ts; nothing in the tests or product is
      wrong. The setup that guarantees the shims exist is incomplete: REQUIRED in
      tests/global-setup-generated.ts lists six of the generated modules the control
      app imports statically and misses ai-ticketing.js, ai-imagegen.js and auth-passwordless.js,
      so a checkout holding the older shims is never regenerated; and only the node
      project registers it, so a workers-only run never generates anything. Make REQUIRED
      cover every ./generated/* module apps/control-app/src imports (keep it one list,
      derived or checked against what buildControlAppAssets writes, so the next shim
      cannot be missed silently), and register the same globalSetup on the workers
      project. Keep using the real generator, never a stub. Prove it by deleting ai-ticketing.js
      (only) and running the AC2025/AC2372 tests alone: they must load and pass.'
    test_scope: test_UAT_AC2025_ or test_UAT_AC2372_ or test_UAT_AC2022_ or test_UAT_AC2023_
      or test_UAT_AC2024_ or test_UAT_AC2030_ or test_UAT_AC2035_ or test_UAT_AC2373_
    ladder:
      rung1: No intent in scope addresses the test setup; REQ-228 introduced the ai-ticketing
        shim the setup does not know about.
      rung2: The reference has no tests/global-setup-generated.ts, so it shows nothing
        about the setup; ai.ts there imports the same generated modules.
      rung3: 'Decides: the AC2025/AC2372 UATs stand and the test infrastructure that
        loads them must generate every shim the control app imports.'
---

# Fix Plan — Iteration 13

## Hypothesis
There are three independent causes, and none of them is the iteration-11 hypothesis (the AC-2487 picture.ts wording, now passing):
1. **Stale stored-picture UATs.** The AC-2485, AC-2486 and AC-2489 UATs still assert the pre-BUG-80 delivery, where the picture is inline in the navigated `data:text/html` document. The code (commit bf1d7bc109) now navigates to a constant shell and delivers the bytes over `driver.query`.
2. **Unwrapped shot.** `rasterizeImage` (screenshot.ts) calls `driver.screenshot` outside its wrapped region, so a failed shot escapes raw. This fails AC-2565 case (c).
3. **Incomplete globalSetup list.** The node globalSetup's REQUIRED list omits `ai-ticketing.js`, which REQ-228 added in this bundle. As a result, the two `.workers` files fail to import, and AC-2025 and AC-2372 read as orphaned.

## Analysis
Evidence comes from quality report REPORT-12033 (report-fb1d588f), commit 47f22f5.

**Group 1: AC2485, AC2486 and AC2489 (stale tests).**
- Failing lines:
  - `tests/reconciliation-assistant-sees-a-stored-picture.test.ts:521` asserts `src="data:image/jpeg;base64,<bytes>"` inside `documentOf(navigated[0])`.
  - Line 564 asserts the same for `image/svg+xml`.
  - Lines 773-774 assert it for `image/gif` and `image/avif`.
- What the navigated document actually is now: the constant `SHELL_DOCUMENT`, an empty `<img id="stored">`. The bytes arrive in two steps:
  - `chunkScript` pushes them into `window.__pic`.
  - `decodeScript` then sets `img.src = 'data:<safeMediaType>;base64,' + …`.
- The ACs agree with the code:
  - AC-2485 was already rewritten for BUG-80: "the address it is navigated to does not carry the picture … bytes reached the browser through its delivery channel rather than in the navigated address".
  - AC-2486 and AC-2489 say nothing about where the bytes travel.
  - So only the tests are wrong.
- The file's fake browser has a harness gap: its `query()` ignores the script, so there is nothing to assert delivery against. `tests/reconciliation-stored-picture-delivery.test.ts` already records `log.queried` and has a `deliveredChunk` helper; that is the pattern to follow.
- The AC2490 UAT at line 726 carries the same stale assertion. It is outside this scope's filter (it showed as skipped), but it lives in the same file and must be corrected the same way so it does not break later.

**Group 2: AC2565 (code gap).**
- The failure is `screenshot: expected Error: Protocol error (Page.captureScreenshot)… to be an instance of ImageNotRenderableError` (`reconciliation-stored-picture-delivery.test.ts:340`).
- In `tools/generate/src/cli/capture/screenshot.ts`, both at the working tree and at `reconcile-src-BUNDLE-44`, `await driver.screenshot(...)` sits in the `return {…}` after the inner try/catch, so `safeDriverMessage` never sees it.
- The AC's own Note records this exact gap: "Case (c) is not met by the code at reconciliation … the shot and the browser lease sit outside the wrapped region."
- AC-2565 says "navigating, delivering its bytes, decoding, or taking the shot". The reference's own doc comment on `rasterizeImage` states the guarantee as "every driver interaction is wrapped, so what escapes is a sentence rather than a payload". The code does not honour its stated intent.

**Group 3: AC2025 and AC2372 (orphans; the test files never loaded).**
- Both `.workers` files failed collection with `Cannot find module './generated/ai-ticketing.js' imported from apps/control-app/src/ai.ts`.
- `apps/control-app/src/generated/` is gitignored and is written by `1c assets` (`assets.ts` `writeAiTicketingShim`, REQ-228).
- `tests/global-setup-generated.ts` regenerates the shims only when a file in `REQUIRED` is missing. REQUIRED lists importmap, ai-workers, ticketing, knowledge, ai-knowledge and kb. It omits three modules the control app imports statically:
  - `ai-ticketing.js` (ai.ts:58)
  - `ai-imagegen`
  - `auth-passwordless`
- A checkout holding the old shims therefore never gets `ai-ticketing.js`.
- In addition, only `vitest.node.config.mts` registers the globalSetup. A workers-only run never generates anything.
- The shims on disk now are timestamped 22:00:35Z, after the 21:59Z quality run. That is consistent with them having been absent during the run.
- Iteration 11's builder saw AC2025 pass only because the shims existed in its environment then.

**Isolation and history.**
- None of these is cross-suite contamination: groups 1 and 2 are deterministic assertion failures, and group 3 is an environment and setup gap.
- The prior batch (REPORT-11615) succeeded, and its AC2487 still passes. This plan targets different files and different causes.
- No hypothesis is repeated.

## Spec Changes Made
None. AC-2485 already states the BUG-80 delivery. AC-2565 already specifies case (c). AC-2486, AC-2489, AC-2025 and AC-2372 are correct as written.

## Weak Evidence Flags (preventative — best effort)
- `tests/reconciliation-assistant-sees-a-stored-picture.test.ts` test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical — drifted-assertion — line 726 asserts inline bytes in the navigated document (pre-BUG-80); assert delivered chunks instead, in the same edit as batch 0.
- `tests/reconciliation-assistant-sees-a-stored-picture.test.ts` (fake `browser()` harness) — weak-observation — `close()` is not counted, so no UAT in this file can prove the browser was released; record closes the way the delivery test's harness does.
- `tests/reconciliation-assistant-sees-a-stored-picture.test.ts` (fake `browser()` harness) — weak-observation — `query()` ignores its script, so an implementation that never delivered the bytes would still "decode"; once batch 0 records scripts, the size answer should depend on bytes having been delivered.

## Batches
- **Batch 0 (tests only):** AC2485, AC2486 and AC2489 in the stored-picture UAT file. The fake browser records `query` scripts. Assertions move from the navigated document to the delivery channel:
  - The navigated address is the constant shell and carries none of the picture.
  - The delivered chunks join to the picture's base64.
  - The decode script names the right media type (`image/jpeg`, `image/svg+xml`, `image/gif`, `image/avif`; never `application/octet-stream`).
  - The same edit fixes the AC2490 assertion.
- **Batch 1 (code_frozen override, `screenshot.ts` only):** AC2565. Bring the shot inside the wrapped region of `rasterizeImage` so its failure becomes the bounded `ImageNotRenderableError` sentence. Route a failed browser lease through the same refusal too. The batch is placed at index 1 because the review denial REPORT-6909 is keyed to batch 0.
- **Batch 2 (test infrastructure):** AC2025 and AC2372. Complete REQUIRED in `tests/global-setup-generated.ts` with every `./generated/*` module the control app imports, and register the same globalSetup on the workers project.
- **Why the batches don't overlap:** each one edits a different file (a UAT file, `screenshot.ts`, and the test setup/config). Batch 0's and batch 1's tests both exercise `rasterizeImage`, so each lists the other's tests as dependency tests.

## Mode overrides (REQ-892)
- **Batch 1:**
  - Rule: `code_frozen`.
  - Files: `tools/generate/src/cli/capture/screenshot.ts`.
  - Rung: 1.
  - Justification: BUG-80 (in scope, and the latest intent on this surface) together with AC-2565 require every browser failure on the stored-picture path, explicitly including "taking the shot", to come back as a bounded picture-not-renderable refusal. The code leaves `driver.screenshot` unwrapped. The reference does not settle the question the other way: its own comment (`screenshot.ts` 312-315 at `reconcile-src-BUNDLE-44`; the unwrapped shot is at line 375, and the unwrapped lease at line 347) claims every driver interaction is wrapped.
  - Trust boundary: yes. The change governs what driver text reaches the model through `safeDriverMessage`.

## Resolution ladder (REQ-938)
- **Batch 0 (decided at rung 1).** BUG-80 is the later intent on this surface and supersedes REQ-218's inline-bytes delivery. AC-2485 was already rewritten to "the address it is navigated to does not carry the picture". So the three tests change and the code does not. At the reference (rung 2), `SHELL_DOCUMENT`, `chunkScript` and `decodeScript` (`screenshot.ts` at `reconcile-src-BUNDLE-44`) show the same delivery.
- **Batch 1 (decided at rung 1).** BUG-80 and AC-2565 ("navigating, delivering its bytes, decoding, or taking the shot") require the shot to be wrapped. At the reference (rung 2), the shot is unwrapped but the reference's own comment states the opposite intent, so rung 2 does not decide against the test. The test stands and the code changes.
- **Batch 2 (decided at rung 3, test infrastructure).** No intent and no reference behaviour is in question: the reference has no `tests/global-setup-generated.ts` at all. The two Worker UATs stand. The setup that loads them must generate every shim the control app imports.
