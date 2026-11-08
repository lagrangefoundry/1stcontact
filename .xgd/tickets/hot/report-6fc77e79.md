---
uid: report-6fc77e79
id: REPORT-11316
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T06:48:08.867192+00:00'
updated_at: '2026-11-08T06:48:08.867192+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-39c992d3
---

UATs generated for story story-39c992d3 (plan item 5 of 6)

⚠️ TESTS FAILING — downstream fix-it loop required

I wrote 14 UATs, one per acceptance criterion: 13 pass and 1 fails because the code doesn't match the AC.

Failures:
  - `test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor`: when the model asks for an aspect ratio the provider can't make, the tool result shown to the model names the vendor: `"That is not a shape this generator offers. The host reports: Backend \"openai\" does not support \"aspectRatios\": 21:9 is not among 1:1, 3:2, 2:3"`. AC-2380 says no error text, including the unsupported-shape one, may name the vendor. I did not weaken the test. The fix belongs where that "host reports" detail is put into the error, either in the framework's imagegen plugin or in how the control app wraps it. The existing FC test misses this because it only checks the refusal path.

Story: story-39c992d3

Test file(s) created:
  - `tests/reconciliation-consultant-image-generation.workers.test.ts`: AC-2379 to AC-2391, run in workerd through `route()` over real D1/R2. Only the Anthropic client, the image provider's `fetch` and, for AC-2385, the knowledge-base embedder are faked.
  - `tests/reconciliation-consultant-image-generation-deploy.test.ts`: AC-2392. It runs the real `30-openai-api-key` hook through the existing `secretHookHarness`.

Tests written: 14
Tests passed: 13
Tests failed: 1

What isn't fully covered:
- **AC-2384:** I check that the Library list and detail return `origin: generated`, which is the field the "Where it came from" row in `library.js` reads. I didn't check that the label is actually drawn on screen; that would need a browser test.
- **AC-2389:** promotion is done by calling `promoteToSiteAsset` directly, because no route promotes existing material on its own.
- **Lint:** ESLint didn't run, because the sandbox blocked downloading it. The type-check (`tsc --noEmit`) reported no errors in the new files.

One more thing I saw but didn't test: when several sessions in the same business generate images, the "budget used up" error comes back sooner than ten attempts into a later session. That suggests the cap counts per business per isolate rather than per session. AC-2386 passes because it uses its own business. Someone should check this against "per session" in the AC.

test_files_created:
  - "tests/reconciliation-consultant-image-generation.workers.test.ts"
  - "tests/reconciliation-consultant-image-generation-deploy.test.ts"