---
uid: report-96aef569
id: REPORT-11085
type: report
title: 'Report: mode_override for story-179b8c06'
created_by: xgd
created_at: '2026-11-07T06:16:18.206996+00:00'
updated_at: '2026-11-07T06:16:18.206996+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: mode_override
  subject_uid: story-179b8c06
  anchor_ticket: bundle-7988e925
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-84738adf
  quality_mode: reconcile
  justification: REQ-200, an intent in scope, requires a closed capabilities record
    ('so a typo is a validation error'); story-179b8c06 records the open record as
    a code issue; AC-2329 encodes exactly that and is right, the non-strict schema
    is wrong.
  files:
  - packages/site-schema/src/schema.ts
  rung: 1
  tip_evidence:
  - file: packages/site-schema/src/schema.ts
    lines: 1097-1107
  external_cause: null
  planner_trust_boundary: false
  granted_head: 693c1d6607eb05863539a6a56ec2dc1cba727a25
---

# Mode override granted: code_frozen

REQ-200, an intent in scope, requires a closed capabilities record ('so a typo is a validation error'); story-179b8c06 records the open record as a code issue; AC-2329 encodes exactly that and is right, the non-strict schema is wrong.

Planner instructions for the batch:

AC-2329 is correct. REQ-200 (in scope) requires the capabilities record to be closed so a typo is a validation error, and the story already records the open record as a code issue. Make siteCapabilitiesSchema in packages/site-schema/src/schema.ts reject unknown keys, so validateSite on capabilities {acounts: true} returns ok=false with an issue naming the key, while an absent record and {accounts: true|false} still validate. Check that no committed site definition (e.g. storage/sites/1stcontact) carries any other capability key. Keep the account-chrome gating tests (AC-2330..2332) and the REQ-200 apex/session suite green.
