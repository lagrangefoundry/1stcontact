---
uid: report-479cd6c2
id: REPORT-11482
type: report
title: 'Report: blocked_by_handoff for STORY-99'
created_by: xgd
created_at: '2026-11-08T14:48:13.763533+00:00'
updated_at: '2026-11-08T14:53:43.516549+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: STORY-99
  rule: code_frozen
  evidence: 'test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry
    fails with ''sized, but not by the control token: builder-people__subject/tolist/body
    → 13px''. apps/control-app/src/builder/builder.css:2041-2053 declares `.builder-people__subject,
    .builder-people__tolist, .builder-people__body { … font: inherit; font-size: 13px;
    }`, a literal, while AC-2232 requires every Contacts dialog input to take the
    single --builder-control-font-size token and forbids restating the size as a literal.
    The sibling .builder-people__add-email rule (line 1951) correctly uses var(--builder-control-font-size).'
  proposed_change: 'apps/control-app/src/builder/builder.css line 2053: replace `font-size:
    13px;` with `font-size: var(--builder-control-font-size);` in the `.builder-people__subject,
    .builder-people__tolist, .builder-people__body` rule. No test or AC change needed.'
  batch_index: 0
  parent_report_uid: report-e9e26bdb
  anchor_ticket: bundle-0d00566a
  ruling: granted
  ruling_reason: the planner granted an override in its plan
---

# Builder blocked by `code_frozen`

**Evidence**: test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry fails with 'sized, but not by the control token: builder-people__subject/tolist/body → 13px'. apps/control-app/src/builder/builder.css:2041-2053 declares `.builder-people__subject, .builder-people__tolist, .builder-people__body { … font: inherit; font-size: 13px; }`, a literal, while AC-2232 requires every Contacts dialog input to take the single --builder-control-font-size token and forbids restating the size as a literal. The sibling .builder-people__add-email rule (line 1951) correctly uses var(--builder-control-font-size).

**Proposed change**: apps/control-app/src/builder/builder.css line 2053: replace `font-size: 13px;` with `font-size: var(--builder-control-font-size);` in the `.builder-people__subject, .builder-people__tolist, .builder-people__body` rule. No test or AC change needed.

## Ruling: granted

the planner granted an override in its plan
