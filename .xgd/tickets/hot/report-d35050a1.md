---
uid: report-d35050a1
id: REPORT-11698
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-09T04:35:31.348283+00:00'
updated_at: '2026-11-09T04:35:31.348283+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: report-d402710c
  findings: []
  overrides_audited: 1
  trust_boundary_overrides: 0
  mode_override_uid: report-569fb9d5
  parent_report_uid: report-d2b30b1e
  batch_index: 0
  attempt: 0
---

# Override conformance

1 overrides audited, 0 touched a trust boundary.

- Item 1 (named files only): pass. unnamed_files_touched is empty; the only production file changed is apps/control-app/src/builder/panel.js, which `files` names.
- Item 3 (matches the intent and AC): pass. BUG-79 says a frame navigates only when what it shows is out of date, never for a mode switch. Recording the frame's real address on each load means a frame that followed a link is no longer re-navigated on the flip back, as rewritten AC-2496 paragraph 3 requires.
- Item 4 (within the planner's scope): pass. The diff adds follow(rec) to the load listener and the follow() function (try/catch, ignore about:blank) plus a reworded comment. Staleness, reloadDocument, setSite/refresh and the visibility classes are unchanged. The test edits are the ones the planner asked for in AC-2496 and AC-2517.
- Item 5 (trust boundary): pass. trust_boundary_touched is false and trust_boundary_mismatch is false.
- Item 6 (code_frozen, rung 1): pass. No file outside `files` is edited and no behaviour beyond the intent is added.

Not a finding: follow() stores the full href, including any query or fragment. The carry and previewUrl() rebuild the URL from the pathname alone, so a frame that followed a link like /about#team still fails sameUrl() in show() and is re-navigated on the flip back. This override does not cause that (before it, every followed link failed the check). It is a remaining BUG-79 gap; the fix is to compare only origin and pathname in follow() or sameUrl().