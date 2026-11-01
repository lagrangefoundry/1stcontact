---
uid: report-fb9c667a
id: REPORT-7863
type: report
title: 'Report: override_misjudged for bundle-39edf66d'
created_by: xgd
created_at: '2026-11-01T22:10:10.657709+00:00'
updated_at: '2026-11-01T22:10:10.657709+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: override_misjudged
  subject_uid: bundle-39edf66d
  anchor_uid: bundle-39edf66d
  review_kind: reconciliation_review
  by_rule:
    code_frozen: 3
  denied:
  - subject_uid: story-a55c2f35
    batch_index: '0'
    rule: code_frozen
---

override_misjudged: the review judged a planner-granted mode override wrong. The fix step works from the finding below.

- rule `code_frozen`, override report report-4f1b02e8 (files: ['apps/control-app/src/router.ts']): Item 3 (consistent with intent): the gate chosen for POST /api/grants and /api/grants/revoke is ownsBusiness(scope.businessId), so any customer owner may mint a live 'pro' grant (on their own or, because body.businessId is unscoped, any business) and revoke any grant by id. Intent makes grants the operator's tool: REQ-183 §6 ('Creating and revoking entitlements is REQ-170's, because a surface that can grant itself access is not a portal'; 'REQ-170 is the operator's tool: every account, every grant') and REQ-180 D2 cited in REQ-183 §5 (a customer-reachable route onto a live pro grant 'is an unbounded free-plan mint').
  Rule `code_frozen` is now denied for batch 0 of story-a55c2f35; it will not be granted again there, so the next plan decides that batch at the next rung.

Misjudged overrides by rule: {'code_frozen': 3}.