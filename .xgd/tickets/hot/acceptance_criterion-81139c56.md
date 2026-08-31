---
uid: acceptance_criterion-81139c56
id: AC-1471
type: acceptance_criterion
title: Requests to any other host still reach the network, so third-party fonts and
  images appear in the picture
created_by: xgd
created_at: '2026-08-31T23:21:13.816028+00:00'
updated_at: '2026-08-31T23:21:13.816028+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7fa314f5
  kind: behavior
  regression_only: false
---

## Criterion

Only the deployment's own host is served from inside the deployment. A request
the page makes to **any other host** is untouched and goes to the network, and
its result is part of the captured page.

A page legitimately loads third-party fonts, images and other subresources. A
capture that silently dropped them would be a different kind of wrong picture —
the same failure shape as photographing a sign-in challenge, arriving by the
opposite route.

## Verification

Capture a draft whose page references a subresource on an unrelated host (for
example a web font). Assert that this request was handed to the network rather
than answered from inside the deployment, while the assertions of the per-host
criterion still hold for the deployment's own host in the same capture.
