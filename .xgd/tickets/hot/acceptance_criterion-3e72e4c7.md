---
uid: acceptance_criterion-3e72e4c7
id: AC-1095
type: acceptance_criterion
title: A whole settings group is written in one call as a structured value, and unnamed
  siblings at every depth survive it
created_by: xgd
created_at: '2026-08-10T09:33:47.564708+00:00'
updated_at: '2026-09-11T03:39:51.390361+00:00'
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
Write a complete colour palette (several named entries, each one colour) in one call and read the settings back: every entry is present. Then write a single entry again with a changed colour: that entry changes and every other entry is still exactly as it was. Show that the merge goes deeper than the first level on a group that is deeper than a palette entry — name one field inside the theme's typography and read the group back: that field changes and the rest of the group is untouched. Write a list-valued setting (a navigation list with entries) and read it back: the list is exactly what was sent, not a merge of the old and new entries.