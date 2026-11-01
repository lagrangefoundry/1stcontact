---
uid: acceptance_criterion-5c0adfdb
id: AC-2193
type: acceptance_criterion
title: A record change leaves absent fields untouched and ignores any observed field
  that is sent
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:06.037719+00:00'
updated_at: '2026-11-01T20:02:33.736782+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
A record change is a patch. A field that is not included in the request is left exactly as it was: sending only a name does not change the email, and sending only an email does not change the name. Fields the system observed are never changed by this write, even if they are included: login status, pipeline stage, invited at, terms accepted, first seen, last seen, and created. A request that includes neither email nor name is refused with 400 and the message "Nothing to change.".

## Verification
Against real D1: submit only a name and assert the email is unchanged. Submit only an email and assert the name is unchanged. Submit a valid name together with values for status, invited at, terms accepted and the stamps, and assert only the name changed, with every observed column byte-identical to its prior value. Submit a body with neither field and assert 400 "Nothing to change.".