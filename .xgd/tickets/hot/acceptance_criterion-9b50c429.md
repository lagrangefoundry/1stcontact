---
uid: acceptance_criterion-9b50c429
id: AC-416
type: acceptance_criterion
title: public-site serves the apex marketing placeholder
created_by: xgd
created_at: '2026-07-08T19:04:27.848312+00:00'
updated_at: '2026-07-08T19:04:27.848312+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ceaf24d
  kind: behavior
  regression_only: false
---

## Criterion
A GET request to the root path of the public-site Worker returns HTTP 200 with a `text/plain` content-type and a response body of exactly `Hello from 1stcontact.io`.

## Verification
Boot the public-site Worker locally, fetch `/`, and assert the status is 200, the content-type header begins with `text/plain`, and the body string equals `Hello from 1stcontact.io`.
