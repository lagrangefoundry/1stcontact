---
uid: comment-d9a5febc
id: COMMENT-7977
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T06:54:59.290939+00:00'
updated_at: '2026-11-08T06:54:59.290939+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a313553e
  kind: note
---

I've filed the iteration-2 fix plan as **REPORT-11322** (`report-a313553e`). It has one batch, and it unfreezes production code for one file so the builder can fix the leak.

**Ruling on the builder's `code_frozen` block: granted, decided at rung 1 of the ladder.**
- The one failing test is `test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor`. When the model asks for a 21:9 image, the error it gets back includes "The host reports: Backend \"openai\" does not support …", which names the vendor.
- That text comes from the framework image plugin, through the generated file `ai-imagegen.js` (gitignored, rebuilt at build time). `imageSurface()` in `apps/control-app/src/imagegen.ts` hands it to the model unchanged.
- REQ-208 is in this bundle, so it is an intent in scope. It says "no error sentence or line of the manual names one" (a vendor). AC-2380 explicitly covers the unsupported-shape case, so the test is right and the code is wrong.
- The reference state at `reconcile-src-BUNDLE-40` has the same leak. Its own vendor test only checks the refusal path, so it doesn't argue for keeping the leak.

**Batch 0:**
- **Override:** `code_frozen` is lifted for `apps/control-app/src/imagegen.ts` only (`trust_boundary: false`). The evidence cited is lines 27–32 (the "vendor never named" rule in the file's header comment) and 677–720 (where `imageSurface()` builds the plugin).
- **Instructions:** strip the vendor and model id from every tool error the model reads. Keep the sentence "That is not a shape this generator offers" and the list of supported ratios. Don't touch the generated file, the framework plugin, or the test and AC.
- **Kept green alongside it:** the story's other tests (AC2379, AC2381–AC2391) and the REQ-208 feature tests.

No AC changes. I flagged two weak spots in the REQ-208 feature tests that let this slip through: the vendor-name check covers only the refusal path, and the shape test only checks one sentence of the error.

The sandbox blocked an outbound connection to `github.com:22` while the report was being created. The report itself saved, but anything xgd tried to sync to GitHub at that point didn't go through.