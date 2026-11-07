---
uid: report-fc4c7654
id: REPORT-11114
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-07T08:01:38.221792+00:00'
updated_at: '2026-11-07T08:01:38.221792+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: story-7b1025b8
  findings: []
  mode_override_uid: report-8a166a9b
  parent_report_uid: report-72de7cec
  batch_index: 0
  attempt: 0
---

# Override conformance

- Item 1 (named files only): PASS. The only production file changed is apps/control-app/src/builder/people.js, which the override names; unnamed_files_touched is empty. The other touched files are tests, which code_frozen does not govern.
- Item 3 (consistent with intent/AC): PASS. The selection is now cleared only when some result has status 'sent', matching REQ-199 ('the selection clears only once something was sent'; 'the selection survives a send in which nothing was sent') and AC-2339. The dialog still stays open over the report. The AC2339 tab UAT now asserts the mixed send clears the selection and disables Invite, so a fix that never clears would fail.
- Item 4 (within stated scope): PASS. The production change is limited to making the clear conditional. The test realignment follows planner part (2): the AC2175 file is deleted (its only test); stale duplicates of ACs proven in test_reconciliation_contacts_add_invite.workers.test.ts are removed (AC2169/1743/1744/2171/2172/2248/2253); ACs with no other evidence are moved onto the add-then-invite-by-id surface; AC2173 and AC2176 are asserted as rewritten.
- Item 5 (trust boundary): PASS. trust_boundary_touched=false, trust_boundary_mismatch=false.
- Item 6 (code_frozen, rung 1): PASS. No file outside `files` is edited, and nothing is added beyond the conditional clear (plus an Array.isArray guard equivalent to the previous `?? []`).

Notes (not findings): the explicit syncInvite() call was removed and the clear now runs before refresh(), relying on refresh() to re-sync the Invite button. The extended UAT's inviteButton().disabled assertion covers this. tip_evidence cites reference lines 1566-1602 while the hunk sits at line 995 on this branch, consistent with the reference and branch files having drifted apart.

1 override audited, 0 touched a trust boundary.