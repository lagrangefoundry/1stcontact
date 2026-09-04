---
uid: acceptance_criterion-437e951e
id: AC-1603
type: acceptance_criterion
title: An invited and entitled person reaches the builder itself through the real
  request path
created_by: xgd
created_at: '2026-09-04T05:52:46.197241+00:00'
updated_at: '2026-09-04T06:00:21.764281+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

An invited person holding a live grant, presenting a valid verified identity, reaches the
builder itself: the request succeeds and returns the builder page, not a refusal.

This holds end to end through the real request path — the identity is verified, the
admission decision is made ahead of any routing, and the surface behind it is then served
normally.

## Verification

Invite a person, then issue a real request to the application carrying a valid verified
identity for that email. Assert the response succeeds, is an HTML page, and contains the
builder's own content. Contrast with the same request for an identity that was never
invited, which must be refused — so that a check which denied everybody could not pass both.