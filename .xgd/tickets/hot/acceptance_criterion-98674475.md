---
uid: acceptance_criterion-98674475
id: AC-1265
type: acceptance_criterion
title: The change log comes back marked untrusted, because it carries the client's
  own words
created_by: xgd
created_at: '2026-08-20T02:27:41.301571+00:00'
updated_at: '2026-08-20T02:46:14.159005+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

The change log comes back marked as **untrusted third-party content** in the projected surface, because it carries the client's own typed words back into the assistant's context and is squarely an injection vector.

## Verification

Read the projected surface for a session granted the site-reading group and assert the change-reading operation declares its returned content untrusted.

Invoke it after a client copy edit and assert the returned content is delivered to the session under the same untrusted-provenance handling every other third-party payload receives.