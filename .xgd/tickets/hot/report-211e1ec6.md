---
uid: report-211e1ec6
id: REPORT-11385
type: report
title: 'Report: override_misjudged for bundle-c0301347'
created_by: xgd
created_at: '2026-11-08T09:32:17.675758+00:00'
updated_at: '2026-11-08T09:32:17.675758+00:00'
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

- rule `code_frozen`, override report report-7519d965 (files: ['apps/control-app/src/ai.ts']): Items 4 and 6, the same as report-ccc38228, report-71747060 and report-ab4c1f17. The planner stated 'No test or AC changes', and `files` names only apps/control-app/src/ai.ts. The recorded diff also edits tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts (since reverted: it no longer differs from main) and tests/support/scripted-model-client.ts (systemText(), still at HEAD and imported by 11 test files). The input has not changed since report-ab4c1f17: the commits since then touch only workflow tickets, and no waiver is recorded. Only an operator waiver of report-7519d965 clears this; no builder or matrix fix can.
  Rule `code_frozen` is now denied for batch 0 of story-4cabde9a; it will not be granted again there, so the next plan decides that batch at the next rung.

Misjudged overrides by rule: {'code_frozen': 9}.