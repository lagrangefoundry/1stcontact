---
uid: acceptance_criterion-dc59f060
id: AC-2075
type: acceptance_criterion
title: A person holding memberships in several businesses is admitted with all of
  them, each carrying its own effective grant and its business name
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T01:33:52.497097+00:00'
updated_at: '2026-11-01T10:22:24.870882+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A person holding active memberships in several businesses is admitted with all of
them. Each business in the admission carries its own identifier, its own name
(the human label, since the identifier is opaque) and its own effective grant, so
two businesses with different grants report different grants.

## Verification

Invite an address, then provision a second business with a different name for the
same person. Attempt admission and assert it succeeds with exactly two
businesses, each reporting its own identifier, the name it was given, a grant that
belongs to that business and not the other, and being selectable.