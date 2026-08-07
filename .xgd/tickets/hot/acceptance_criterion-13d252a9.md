---
uid: acceptance_criterion-13d252a9
id: AC-960
type: acceptance_criterion
title: Every name the workspace shows for the site surface has exactly one definition
  site
created_by: xgd
created_at: '2026-08-07T01:43:51.151373+00:00'
updated_at: '2026-08-07T01:58:20.927936+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

The human-readable name the workspace shows for the site surface is declared
once. Changing that single declaration changes every place the name is shown —
the tab's visible label and the accessible name of the site selector — and the
name appears as a literal in no other source location in the repository.

## Verification

Search the whole source tree (application, tooling and package sources) for the
label string and assert the only occurrence is the single declaration. Mount the
workspace and assert the tab's rendered label and the site selector's accessible
name both equal that declared value, so a rename cannot leave one of them
stale.