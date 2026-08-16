---
uid: acceptance_criterion-3e72e4c7
id: AC-1095
type: acceptance_criterion
title: A whole settings group is written in one call as a structured value, and unnamed
  siblings at every depth survive it
created_by: xgd
created_at: '2026-08-10T09:33:47.564708+00:00'
updated_at: '2026-08-16T01:56:52.385624+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Writing a site's settings takes a group name and an object of settings to write in that group. Two objects merge at every depth; a list or a scalar replaces whole. Naming one setting inside a group leaves every other setting in that group — and every nested setting under those — exactly as it was.

## Verification
Write a complete colour palette (several families, each with steps) in one call and read the settings back: every family and step is present. Then write a single family again with one changed step: that step changes, the other steps in that family are still there, and every other family is untouched. Write a list-valued setting (a navigation list with entries) and read it back: the list is exactly what was sent, not a merge of the old and new entries.