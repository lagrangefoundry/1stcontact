---
uid: comment-2f6ffb21
id: COMMENT-5853
type: comment
title: Comment on bug BUG-316
created_by: xgd
created_at: '2026-10-30T21:32:50.456598+00:00'
updated_at: '2026-10-30T21:32:50.456598+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-d9778adf
  kind: note
---

Fix landed during BUNDLE-32 reconciliation under rung-1 code_frozen grant report-d58b23f8 (tools/generate/src/cli/ai/fidelity-core.ts, contentBlocksFrom keeps the <<<untrusted>>> frame on the picture path). AC-2067 (acceptance_criterion-827e8986) was rewritten to require the frame and its two UATs pass at HEAD (reconciliation review report-e82f1d68 confirms). Recorded in STORY-157 (story-58b2cec4). Status left for the operator to close.