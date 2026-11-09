---
uid: report-c0389fea
id: REPORT-12039
type: report
title: 'Report: mode_override for story-58b2cec4'
created_by: xgd
created_at: '2026-11-09T22:22:22.975137+00:00'
updated_at: '2026-11-09T22:22:22.975137+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: story-58b2cec4
  anchor_ticket: bundle-374f88d6
  rule: code_frozen
  batch_index: 1
  parent_report_uid: report-45273bd1
  quality_mode: reconcile
  justification: BUG-80 (in scope, latest intent on this surface) and AC-2565 require
    any browser failure while rasterising a stored picture, explicitly including taking
    the shot, to be a bounded picture-not-renderable refusal so no tool result can
    end the conversation; the code leaves driver.screenshot unwrapped, and the reference
    does not settle it the other way since its own comment on rasterizeImage states
    every driver interaction is wrapped.
  files:
  - tools/generate/src/cli/capture/screenshot.ts
  tests:
  - a browser failure on the stored-picture path comes back as a sentence test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released
  rung: 1
  tip_evidence:
  - file: tools/generate/src/cli/capture/screenshot.ts
    lines: 312-315
  - file: tools/generate/src/cli/capture/screenshot.ts
    lines: 347-380
  external_cause: null
  planner_trust_boundary: true
  granted_head: ee224ae985c93a65135207c69baa51ea331f9b7c
---

# Mode override granted: code_frozen

BUG-80 (in scope, latest intent on this surface) and AC-2565 require any browser failure while rasterising a stored picture, explicitly including taking the shot, to be a bounded picture-not-renderable refusal so no tool result can end the conversation; the code leaves driver.screenshot unwrapped, and the reference does not settle it the other way since its own comment on rasterizeImage states every driver interaction is wrapped.

Planner instructions for the batch:

AC-2565 case (c) fails: a shot that rejects (Protocol error (Page.captureScreenshot) ... with a multi-MB payload) reaches the caller unwrapped, because in rasterizeImage the await driver.screenshot(...) sits in the return after the try/catch that applies safeDriverMessage. Bring the shot inside the same wrapped region so every driver failure on this path (navigate, chunk delivery, decode query, shot) becomes the one ImageNotRenderableError sentence naming the picture, carrying the sanitised driver diagnosis (its net:: code survives) and saying there is no picture to show; route a rejected browser lease (factory()) through the same bounded refusal. Do not wrap the deliberate decode refusal (size.ok false) a second time: its wording is asserted by AC2485. The finally that closes the driver must still close it on every path. Edit only screenshot.ts; screenshotAndMeasure and the page-shot path are out of scope.
