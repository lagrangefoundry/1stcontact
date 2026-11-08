---
uid: report-b37233c7
id: REPORT-11396
type: report
title: 'Fix reconciliation review: bundle-c0301347'
created_by: xgd
created_at: '2026-11-08T10:31:13.995929+00:00'
updated_at: '2026-11-08T10:31:13.995929+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-c0301347
  needs_more_work: true
  progress_made: false
---

## Stories created
None this pass. (The previous pass, report-11b1c533, already acted on every matrix/evidence gap in review report-9179b6e2; no newer review exists.)

## Stories modified
None this pass.

## Stories deleted
None

## ACs superseded
None this pass (AC-1492 was superseded by request-68718201 in the previous pass).

## FC orphans renamed/deleted
None (no fc_orphan_check report exists for this anchor).

## Code changes
None this pass. The previous pass's test edits (11 files under tests/) remain in the working tree for the workflow's test run.

## Outstanding — production-code gap (BUG-1668; planner exception needed)
Gap 5(a), story-39c992d3, AC-2380 / REQ-208 property 1 ("the model never learns which vendor drew the image"):
- Confirmed still present: the ai-imagegen plugin writes `- Provider: ${generation.provider}` / `- Model: ${generation.model}` into the material body (node_modules/@lagrangefoundry/ai-imagegen/src/toolbox.js:757-758, also 810-811), and apps/control-app/src/imagegen.ts passes that body to the store unchanged and indexes it (imagegen.ts:260), so it reaches the session knowledge base.
- Requested remediation (rung 1, imagegen.ts only): strip the Provider/Model lines in generatedMaterialStore.create before storing (description_model already records the model), then extend AC-2380's UAT to search knowledge after a generation and assert no vendor/model name, with a case-insensitive vendor match and a refusal double that echoes the vendor.

Gap 3(f) needs a test run, not an edit: `xgd quality run --stories story-3cf3d57b` (and story-a58a0974). Not run here per instructions.

## Confidence
All other findings were addressed last pass. The next review will FAIL on 5(a) until the planner grants the scoped imagegen.ts exception.
