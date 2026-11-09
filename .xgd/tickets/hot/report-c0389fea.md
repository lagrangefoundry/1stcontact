---
uid: report-c0389fea
id: REPORT-12039
type: report
title: 'Report: mode_override for story-58b2cec4'
created_by: xgd
created_at: '2026-11-09T22:22:22.975137+00:00'
updated_at: '2026-11-09T22:28:07.069363+00:00'
completed_at: null
last_field_updated: conformance_verdict
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
  files_touched:
  - tools/generate/src/cli/capture/screenshot.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
  conformance_verdict: pass
  conformance_findings: []
---

# Mode override granted: code_frozen

BUG-80 (in scope, latest intent on this surface) and AC-2565 require any browser failure while rasterising a stored picture, explicitly including taking the shot, to be a bounded picture-not-renderable refusal so no tool result can end the conversation; the code leaves driver.screenshot unwrapped, and the reference does not settle it the other way since its own comment on rasterizeImage states every driver interaction is wrapped.

Planner instructions for the batch:

AC-2565 case (c) fails: a shot that rejects (Protocol error (Page.captureScreenshot) ... with a multi-MB payload) reaches the caller unwrapped, because in rasterizeImage the await driver.screenshot(...) sits in the return after the try/catch that applies safeDriverMessage. Bring the shot inside the same wrapped region so every driver failure on this path (navigate, chunk delivery, decode query, shot) becomes the one ImageNotRenderableError sentence naming the picture, carrying the sanitised driver diagnosis (its net:: code survives) and saying there is no picture to show; route a rejected browser lease (factory()) through the same bounded refusal. Do not wrap the deliberate decode refusal (size.ok false) a second time: its wording is asserted by AC2485. The finally that closes the driver must still close it on every path. Edit only screenshot.ts; screenshotAndMeasure and the page-shot path are out of scope.

## Diff

```diff
diff --git a/tools/generate/src/cli/capture/screenshot.ts b/tools/generate/src/cli/capture/screenshot.ts
index 59082dd050..430613a0bd 100644
--- a/tools/generate/src/cli/capture/screenshot.ts
+++ b/tools/generate/src/cli/capture/screenshot.ts
@@ -15,7 +15,7 @@
  */
 import { drivePage } from './interact'
 import type { PageStep } from './interact'
-import type { BrowserDriverFactory, Viewport } from './types'
+import type { BrowserDriver, BrowserDriverFactory, Viewport } from './types'
 
 /**
  * Named viewport presets (DOC-8 §3.4). Width is the deterministic dimension;
@@ -313,8 +313,25 @@ export async function rasterizeImage(
     )
   }
 
+  // THE BUG-80 GUARANTEE. Whatever the driver was holding — the document, the
+  // script, a URL, the shot — stops here. What continues is a bounded sentence
+  // naming the picture and the driver's own code. Every driver interaction on
+  // this path (the lease, navigation, delivery, decode and the shot) goes
+  // through it.
+  const unrenderable = (err: unknown): ImageNotRenderableError =>
+    new ImageNotRenderableError(
+      `${what} could not be put in front of the browser: ${safeDriverMessage(err)}. ` +
+        `There is no picture to show you; say so and work from what the Library says ` +
+        `about it instead.`,
+    )
+
   const base64 = toBase64(bytes)
-  const driver = await factory()
+  let driver: BrowserDriver
+  try {
+    driver = await factory()
+  } catch (err) {
+    throw unrenderable(err)
+  }
   try {
     let size: DecodeReport
     try {
@@ -324,16 +341,11 @@ export async function rasterizeImage(
       }
       size = await driver.query<DecodeReport>(decodeScript(mediaType))
     } catch (err) {
-      // THE BUG-80 GUARANTEE. Whatever the driver was holding — the document, the
-      // script, a URL — stops here. What continues is a bounded sentence naming
-      // the picture and the driver's own code.
-      throw new ImageNotRenderableError(
-        `${what} could not be put in front of the browser: ${safeDriverMessage(err)}. ` +
-          `There is no picture to show you; say so and work from what the Library says ` +
-          `about it instead.`,
-      )
+      throw unrenderable(err)
     }
 
+    // The deliberate decode refusal is its own sentence, not a driver failure,
+    // so it is thrown outside the wrapped regions and never re-wrapped.
     if (!size.ok || !size.width || !size.height) {
       throw new ImageNotRenderableError(
         `${what} is stored as ${mediaType} and the browser would not decode it, so there ` +
@@ -341,8 +353,15 @@ export async function rasterizeImage(
           `work from what the Library says about it instead.`,
       )
     }
+
+    let shot: Uint8Array
+    try {
+      shot = await driver.screenshot({ width: size.width, height: size.height })
+    } catch (err) {
+      throw unrenderable(err)
+    }
     return {
-      bytes: await driver.screenshot({ width: size.width, height: size.height }),
+      bytes: shot,
       width: size.width,
       height: size.height,
       naturalWidth: size.naturalWidth ?? size.width,

```