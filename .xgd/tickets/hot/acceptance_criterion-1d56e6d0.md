---
uid: acceptance_criterion-1d56e6d0
id: AC-417
type: acceptance_criterion
title: control-app serves the builder/portal placeholder
created_by: xgd
created_at: '2026-07-08T19:04:30.517305+00:00'
updated_at: '2026-07-08T19:04:30.517305+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0ceaf24d
  kind: behavior
  regression_only: false
---

## Criterion
A GET request to the root path of the control-app Worker returns HTTP 200 with a `text/plain` content-type and a response body of exactly `Hello from app.1stcontact.io`.

## Verification
Boot the control-app Worker locally, fetch `/`, and assert the status is 200, the content-type header begins with `text/plain`, and the body string equals `Hello from app.1stcontact.io`.
