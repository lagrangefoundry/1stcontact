---
uid: report-a1a9798e
id: REPORT-7830
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-01T19:59:15.322368+00:00'
updated_at: '2026-11-01T19:59:15.322368+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: story-a55c2f35
  mode_override_uid: report-4f1b02e8
  parent_report_uid: report-7c2db52c
  batch_index: 0
  attempt: 0
  findings: []
---

# Override conformance

- Item 1 (named files): PASS — files_touched = files = [apps/control-app/src/router.ts]; unnamed_files_touched is empty.
- Item 3 (intent/AC consistency): PASS — REQ-170 says 'a grant that names no business is refused' and 'the gate that matters is at the API'. AC-2200 requires a 403 for open grant, withdraw grant and person-status change by a non-owner of the scoped business, with nothing written. AC-2198/2199 pin a 400 with a message for an empty business, an empty plan and an unknown revoke id. The diff does exactly these things.
- Item 4 (planner scope): PASS — the diff makes the two changes the planner named: InvalidGrantError -> 400 next to the InvalidPersonRecordError mapping, and an ownsBusiness gate via requireScope() on POST /api/grants, /api/grants/revoke and /api/people/status. Each gate answers 403 with a sentence and logs a refusal event before the body is read. people.ts is unchanged.
- Item 5 (trust boundary): PASS — trust_boundary_touched=false and trust_boundary_mismatch=false.
- Item 6 (code_frozen, rung 1): PASS — the only file edited is the named one. The refuseNonOwner helper copies the existing person_record_refused/invite_refused logging (same event/businessId/email shape) and adds no behaviour beyond what AC-2200 and the planner asked for.

Notes (not findings): the InvalidGrantError -> 400 mapping also covers people.ts:693 ('The grant was not readable back after writing.'). That is arguably a server fault, but it now answers 400 instead of 500. This comes from the existing error class, not from the batch. It is worth a follow-up if the distinction matters.

1 override audited, 0 touched a trust boundary.