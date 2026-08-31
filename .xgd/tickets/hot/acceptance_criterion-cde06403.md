---
uid: acceptance_criterion-cde06403
id: AC-1461
type: acceptance_criterion
title: A deployment with no browser capability configured still edits, renders and
  publishes; only a screenshot fails, naming what is missing
created_by: xgd
created_at: '2026-08-31T22:53:29.686224+00:00'
updated_at: '2026-08-31T23:04:42.830258+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-080c6036
  kind: behavior
  regression_only: false
---

## Criterion

Absence of a configured browser capability is an ordinary deployment state, not
a boot failure:

- the deployment starts, and editing, rendering and publishing a site are
  unaffected;
- an attempted screenshot fails with a distinctly identifiable error whose
  message states that no browser capability is configured for this deployment
  and names the configuration entry that is absent.

The failure is a named, catchable kind, distinguishable by a caller from a page
error or a time-limit exit, so a caller can report "this deployment cannot take
pictures" rather than a null-dereference.

## Verification

Start the deployment with no browser capability configured. Assert a draft edit,
a preview render and a publish all succeed. Then request a screenshot and assert
the call fails with the named configuration error, whose message identifies the
missing capability by its configuration name.