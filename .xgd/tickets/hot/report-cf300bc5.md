---
uid: report-cf300bc5
id: REPORT-11321
type: report
title: 'Report: blocked_by_handoff for story-39c992d3'
created_by: xgd
created_at: '2026-11-08T06:53:03.269416+00:00'
updated_at: '2026-11-08T06:57:32.766480+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-39c992d3
  rule: code_frozen
  evidence: 'Ran `npx vitest run tests/reconciliation-consultant-image-generation.workers.test.ts
    -t AC2380`: 1 failed. The unsupported-shape tool result reads ''Error: CreateImage
    failed (unknown_aspect_ratio). That is not a shape this generator offers. The
    host reports: Backend "openai" does not support "aspectRatios": 21:9 is not among
    1:1, 3:2, 2:3'', so the assertion that no tool result contains ''openai'' fails.
    REQ-208 (''no error sentence or line of the manual names one''), the property-1
    header comment in apps/control-app/src/imagegen.ts, and AC-2380 (which lists the
    unsupported-shape path explicitly) all require this text to be free of vendor
    names. The test is correct; the code leaks the vendor name in this one path.'
  proposed_change: 'apps/control-app/src/imagegen.ts: where imageSurface() builds
    the plugin via images.createImagePlugin(...), wrap the create_image tool''s result/error
    text so any vendor identity is scrubbed before it reaches the model. Either drop
    the framework''s ''The host reports: …'' detail from errors, or replace every
    occurrence of IMAGE_PROVIDER (and the backend''s model id) with a neutral word
    such as ''the generator'', keeping the ''not a shape this generator offers'' sentence
    and the list of supported ratios. A cleaner alternative is to fix it upstream
    in the framework imagegen plugin by not interpolating the backend name into the
    unknown_aspect_ratio error, then regenerate apps/control-app/src/generated/ai-imagegen.js.
    No test or AC change is needed; test_UAT_AC2380 passes once the text is vendor-free.'
  batch_index: 0
  parent_report_uid: report-282d41b0
  anchor_ticket: bundle-c0301347
  ruling: granted
  ruling_reason: the planner granted an override in its plan
---

# Builder blocked by `code_frozen`

**Evidence**: Ran `npx vitest run tests/reconciliation-consultant-image-generation.workers.test.ts -t AC2380`: 1 failed. The unsupported-shape tool result reads 'Error: CreateImage failed (unknown_aspect_ratio). That is not a shape this generator offers. The host reports: Backend "openai" does not support "aspectRatios": 21:9 is not among 1:1, 3:2, 2:3', so the assertion that no tool result contains 'openai' fails. REQ-208 ('no error sentence or line of the manual names one'), the property-1 header comment in apps/control-app/src/imagegen.ts, and AC-2380 (which lists the unsupported-shape path explicitly) all require this text to be free of vendor names. The test is correct; the code leaks the vendor name in this one path.

**Proposed change**: apps/control-app/src/imagegen.ts: where imageSurface() builds the plugin via images.createImagePlugin(...), wrap the create_image tool's result/error text so any vendor identity is scrubbed before it reaches the model. Either drop the framework's 'The host reports: …' detail from errors, or replace every occurrence of IMAGE_PROVIDER (and the backend's model id) with a neutral word such as 'the generator', keeping the 'not a shape this generator offers' sentence and the list of supported ratios. A cleaner alternative is to fix it upstream in the framework imagegen plugin by not interpolating the backend name into the unknown_aspect_ratio error, then regenerate apps/control-app/src/generated/ai-imagegen.js. No test or AC change is needed; test_UAT_AC2380 passes once the text is vendor-free.

## Ruling: granted

the planner granted an override in its plan
