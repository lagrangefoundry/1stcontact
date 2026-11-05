---
uid: report-14dae156
id: REPORT-11073
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-05T22:08:21.874512+00:00'
updated_at: '2026-11-05T22:08:21.874512+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: story-179b8c06
  mode_override_uid: report-078b06e6
  parent_report_uid: report-84738adf
  batch_index: 0
  attempt: 0
  findings: []
---

# Override conformance

- Item 1 (named files): PASS. files_touched = [packages/site-schema/src/schema.ts], which matches `files`; unnamed_files_touched is empty. The only other changes in the diff from granted_head are .xgd ticket/changelog files, which fall outside code_frozen.
- Item 3 (consistent with intent/AC): PASS. REQ-200 requires a closed capabilities record, so a typo is a validation error. AC-2329 asks that capabilities {acounts: true} fail validation and name the key. `.strict()` on siteCapabilitiesSchema does exactly this, and an absent record or {accounts: true|false} still validates. The only committed capabilities record (storage/sites/1stcontact/draft/site.json) carries just `accounts: true`, so nothing in the repo is newly rejected.
- Item 4 (within stated scope): PASS. The diff is the single line `}).strict()`, the planner's stated instruction (make siteCapabilitiesSchema reject unknown keys). It adds no other behaviour, branches, error handling or API.
- Item 5 (trust boundary): PASS. trust_boundary_touched=false, trust_boundary_mismatch=false.
- Item 6 (code_frozen, rung 1): PASS. Rung 1 (intent in scope: REQ-200) decided it. The edit is confined to the named file and adds only the closed-record behaviour that REQ-200 and AC-2329 demand. Consistent with the strict-object rule in the security policy.

1 override audited, 0 touched a trust boundary.