---
uid: report-9c6ca9ed
id: REPORT-11088
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-07T06:23:54.327656+00:00'
updated_at: '2026-11-07T06:23:54.327656+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: story-179b8c06
  findings: []
  mode_override_uid: report-96aef569
  parent_report_uid: report-84738adf
  batch_index: 0
  attempt: 0
---

# Override conformance

Override: code_frozen, rung 1, story-179b8c06, files: packages/site-schema/src/schema.ts. 1 override audited, 0 touched a trust boundary.

- Item 1: PASS. unnamed_files_touched is empty; the only file touched is tests/reconciliation-behavior-account-chrome.test.ts, a test file the code_frozen rule does not cover. No production code was changed.
- Item 3: PASS. The strengthened assertion (validateSite({capabilities:{acounts:true}}) is ok=false with a capabilities-path issue naming 'acounts'; undefined, {accounts:true} and {accounts:false} validate) matches AC-2329 and REQ-200 ('so a typo is a validation error').
- Item 4: PASS. The added assertions match the planner's instructions word for word ('returns ok=false with an issue naming the key, while an absent record and {accounts: true|false} still validate'); nothing beyond that.
- Item 5: PASS. trust_boundary_touched=false, trust_boundary_mismatch=false.
- Item 6: PASS. No file outside `files` was edited and no production behaviour was added (the diff has no production changes at all).

Note (not a finding): code_frozen was lifted for schema.ts, but the batch did not change schema.ts and still passed its quality check. Either siteCapabilitiesSchema already rejects unknown keys at granted_head 693c1d6607 (tip_evidence schema.ts:1097-1107), so no override was needed, or the quality check did not exercise this test. The final review should confirm which. The planner's instruction to check that no committed site definition (e.g. storage/sites/1stcontact) carries any other capability key has no evidence in this diff.