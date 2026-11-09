---
uid: acceptance_criterion-57778c84
id: AC-2565
type: acceptance_criterion
title: 'Any browser failure while rasterising a stored picture is a picture-not-renderable
  refusal with no data: URL, no long base64 run, and under a fixed character cap'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T21:56:32.064163+00:00'
updated_at: '2026-11-09T22:37:38.524662+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
Any browser failure while a stored picture is being put in front of the browser and photographed — leasing the browser, navigating, delivering its bytes, decoding, or taking the shot — is refused as a picture-not-renderable error. The refusal names the picture, keeps the browser's own diagnosis (e.g. its `net::` code), says there is no picture to show and to say so, and contains no `data:` address and no run of 120 or more base64 characters; the browser's diagnosis is cut to at most 400 characters, so the whole refusal stays a few hundred characters however large the payload the browser echoed. No failure on this path can hand the model a tool result large enough to end the conversation, and the browser is released on every path where one was leased.

## Verification
With a fake browser (BUG-80): (a) make navigation reject with a message of the form `net::ERR_ABORTED at data:text/html;base64,<multi-MB payload>`; (b) make a byte delivery reject echoing its script; (c) make the shot itself reject echoing a large payload; (d) feed the sanitiser a novel multi-KB message with no `data:` or base64. In each case assert the error is a picture-not-renderable error naming the picture, contains no `data:` URL and no ≥120-char base64 run, is under a fixed small character cap, still carries the driver's own code where it had one, and the browser was closed.

## Note
Case (c) was not met at reconciliation (2026-11-09). It is now met: under code_frozen override (BUNDLE-44 test_fix batch 1, rung 1), `rasterizeImage` (`tools/generate/src/cli/capture/screenshot.ts`) routes the browser lease (`factory()`), navigation, chunk delivery, the decode query and `driver.screenshot` through the same `safeDriverMessage`-bounded `ImageNotRenderableError`. The deliberate decode refusal ("the browser would not decode it") is thrown outside the wrapped regions and is not wrapped a second time. UAT `test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released` passes.