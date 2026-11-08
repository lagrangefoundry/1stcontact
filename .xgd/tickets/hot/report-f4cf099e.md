---
uid: report-f4cf099e
id: REPORT-11373
type: report
title: 'Report: override_misjudged for bundle-c0301347'
created_by: xgd
created_at: '2026-11-08T09:01:22.804454+00:00'
updated_at: '2026-11-08T09:01:22.804454+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: override_misjudged
  subject_uid: bundle-c0301347
  anchor_uid: bundle-c0301347
  review_kind: reconciliation_review
  by_rule:
    code_frozen: 9
  denied:
  - subject_uid: story-4cabde9a
    batch_index: '0'
    rule: code_frozen
---

override_misjudged: the review judged a planner-granted mode override wrong. The fix step works from the finding below.

- rule `code_frozen`, override report report-7519d965 (files: ['apps/control-app/src/ai.ts']): Items 4 and 6, unchanged from report-ccc38228, report-71747060 and REPORT-11361. The planner stated 'No test or AC changes' and `files` names only apps/control-app/src/ai.ts. The recorded diff also edits tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts (since reverted; no diff against main) and tests/support/scripted-model-client.ts (systemText(), still at HEAD and imported by the FC REQ-206/207/208 suites). No builder remediation remains. Only an operator waiver of report-7519d965 clears this.
  Rule `code_frozen` is now denied for batch 0 of story-4cabde9a; it will not be granted again there, so the next plan decides that batch at the next rung.

Misjudged overrides by rule: {'code_frozen': 9}.