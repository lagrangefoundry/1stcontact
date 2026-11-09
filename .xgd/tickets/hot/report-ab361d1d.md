---
uid: report-ab361d1d
id: REPORT-11706
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-09T05:00:23.122458+00:00'
updated_at: '2026-11-09T05:00:23.122458+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: report-d402710c
  findings: []
  overrides_audited: 1
  trust_boundary_overrides: 0
  mode_override_uid: report-79175cb7
  parent_report_uid: report-d2b30b1e
  batch_index: 0
  attempt: 0
---

# Override conformance

1 overrides audited, 0 touched a trust boundary.

- Item 1 (named files only): pass. unnamed_files_touched is empty; the only file changed is a test file, which code_frozen does not govern.
- Item 3 (matches the intent and AC): pass. The site-change case now checks the frame src attributes: Edit is previewUrl('acme','edit') before View's new-site document arrives and previewUrl('other','edit') after it, and View is previewUrl('other','draft'). That shows every channel is invalidated and the idle channel is primed, as BUG-79 requires. The old navsOf reads ran inside the load's call stack, before the observer delivers its records, so they could never reflect what happened.
- Item 4 (within the planner's scope): pass. One assertion block in the planner-named BUG-79 flip suite is changed to read observable state; nothing else changes.
- Item 5 (trust boundary): pass. trust_boundary_touched is false and trust_boundary_mismatch is false.
- Item 6 (code_frozen, rung 1): pass. No production file is edited and no behaviour is added.

Not a finding: the old expect(navsOf(viewFrame())).toEqual([]) claimed that priming never re-points the frame on screen. Its replacement only checks View's final src, so a second navigation of View to the same URL would now go undetected. The old synchronous read never saw any records, so it never proved this either; an assertion made after an await would restore the check.