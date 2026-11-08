---
uid: report-b117e120
id: REPORT-11320
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T06:52:59.085151+00:00'
updated_at: '2026-11-08T06:52:59.085151+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-39c992d3
  parent_report_uid: report-282d41b0
  batch_index: '0'
---

I made no edits: the fix this test needs is in production code, which is frozen for this pass (`[rule:code_frozen]`).

**Cause.** `test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor` fails on its vendor-name check. The error the model gets when it asks for a shape the generator can't make (the 21:9 case) names the vendor:

```
Error: CreateImage failed (unknown_aspect_ratio). That is not a shape this generator offers. The host reports: Backend "openai" does not support "aspectRatios": 21:9 is not among 1:1, 3:2, 2:3
```

The success, refusal and budget-exhausted paths all pass, and so does the check that the tool takes no `provider`/`model` parameter. Only the shape error leaks.

**Why the test is right and the code is wrong:**
- REQ-208 says "no error sentence or line of the manual names one" (a vendor).
- `apps/control-app/src/imagegen.ts` lists the same rule as the first of its "THREE PROPERTIES THIS FILE IS RESPONSIBLE FOR".
- AC-2380 names "unsupported shape" explicitly among the error paths.

The "The host reports: …" part comes from the framework's image plugin, and `imagegen.ts` passes it to the model unchanged. The original FC test never caught this because it only checked the refusal path for vendor names. Its shape test only checked the "not a shape" wording.

Narrowing the AC to leave out the shape path would mean writing a known defect into the spec, against what the intent says outright. That would weaken the assertion, so I didn't do it.

```yaml
## Assessment
blocked_by:
  rule: code_frozen
  evidence: "Ran `npx vitest run tests/reconciliation-consultant-image-generation.workers.test.ts -t AC2380`: 1 failed. The unsupported-shape tool result reads 'Error: CreateImage failed (unknown_aspect_ratio). That is not a shape this generator offers. The host reports: Backend \"openai\" does not support \"aspectRatios\": 21:9 is not among 1:1, 3:2, 2:3', so the assertion that no tool result contains 'openai' fails. REQ-208 ('no error sentence or line of the manual names one'), the property-1 header comment in apps/control-app/src/imagegen.ts, and AC-2380 (which lists the unsupported-shape path explicitly) all require this text to be free of vendor names. The test is correct; the code leaks the vendor name in this one path."
  proposed_change: "apps/control-app/src/imagegen.ts: where imageSurface() builds the plugin via images.createImagePlugin(...), wrap the create_image tool's result/error text so any vendor identity is scrubbed before it reaches the model. Either drop the framework's 'The host reports: …' detail from errors, or replace every occurrence of IMAGE_PROVIDER (and the backend's model id) with a neutral word such as 'the generator', keeping the 'not a shape this generator offers' sentence and the list of supported ratios. A cleaner alternative is to fix it upstream in the framework imagegen plugin by not interpolating the backend name into the unknown_aspect_ratio error, then regenerate apps/control-app/src/generated/ai-imagegen.js. No test or AC change is needed; test_UAT_AC2380 passes once the text is vendor-free."
```