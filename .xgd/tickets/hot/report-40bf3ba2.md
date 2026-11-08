---
uid: report-40bf3ba2
id: REPORT-11350
type: report
title: 'Report: override_misjudged for bundle-c0301347'
created_by: xgd
created_at: '2026-11-08T07:59:55.546364+00:00'
updated_at: '2026-11-08T07:59:55.546364+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: override_misjudged
  subject_uid: bundle-c0301347
  anchor_uid: bundle-c0301347
  review_kind: reconciliation_review
  by_rule:
    code_frozen: 7
  denied:
  - subject_uid: story-4cabde9a
    batch_index: '0'
    rule: code_frozen
---

override_misjudged: the review judged a planner-granted mode override wrong. The fix step works from the finding below.

- rule `code_frozen`, override report report-7519d965 (files: ['apps/control-app/src/ai.ts']): Items 4 and 6: the planner's stated scope was one production change in apps/control-app/src/ai.ts with 'No test or AC changes', and `files` names only ai.ts. The diff also edited tests/test_UAT_FC_REQ-146_worker_ai_boundary.test.ts, loosening the router error-scrub assertion, and added a systemText() helper to tests/support/scripted-model-client.ts. Neither file is named and no AC in scope (AC-2097, AC-2378, FC_REQ-207, FC_REQ-173) demands the REQ-146 change. The in-loop conformance verdict was already 'fail'. The REQ-146 edit has since been reverted, but the helper is still at HEAD (scripted-model-client.ts:80, used by the AC2378 UAT).
  Rule `code_frozen` is now denied for batch 0 of story-4cabde9a; it will not be granted again there, so the next plan decides that batch at the next rung.

Misjudged overrides by rule: {'code_frozen': 7}.