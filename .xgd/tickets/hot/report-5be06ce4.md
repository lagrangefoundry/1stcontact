---
uid: report-5be06ce4
id: REPORT-11331
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-08T07:10:17.802522+00:00'
updated_at: '2026-11-08T07:10:17.802522+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: story-39c992d3
  findings: []
  mode_override_uid: report-483291fe
  parent_report_uid: report-a313553e
  batch_index: 0
  attempt: 1
---

# Override conformance

- Item 1 (named files only): PASS — files_touched is apps/control-app/src/imagegen.ts only; unnamed_files_touched is empty.
- Item 3 (consistent with intent/AC): PASS — REQ-208 requires that no model-visible error sentence names the image vendor; the wrapper rewrites `Backend "<vendor>"` to "This generator" and any remaining IMAGE_PROVIDER, backend name or model id to "the generator", in both message and detail. It keeps the declared sentence and the supported-ratio list that the AC-2380 shape ACs depend on.
- Item 4 (within stated scope): PASS — composed inside imageSurface() next to the existing wrapper as instructed; scrubs the provider and the backend model id; does not touch the generated ai-imagegen.js, the framework plugin, AC-2380 or its test. Covering edit_image falls within "every tool error the model reads".
- Item 5 (trust boundary): PASS — the audited fields for this diff record trust_boundary_touched false, trust_boundary_mismatch false and no matches. The earlier conformance finding on this report (item 5, mismatch true) quotes RegExp-escaping lines that are not in this diff; the current attempt uses plain case-insensitive matching (replaceIgnoringCase), so that finding is stale.
- Item 6 (code_frozen, rung 1): PASS — the diff edits only the named file, and every added behaviour (vendor and model scrubbing on create_image/edit_image failures) is demanded by REQ-208 and the planner's instruction.

Notes (not findings): only Error instances are scrubbed, so a non-Error throw would pass through unchanged; the error object is mutated in place; replacing a model id with "the generator" can read awkwardly. None of these affect AC-2380.

1 override audited, 0 touched a trust boundary.