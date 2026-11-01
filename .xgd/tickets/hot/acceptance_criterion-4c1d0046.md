---
uid: acceptance_criterion-4c1d0046
id: AC-1760
type: acceptance_criterion
title: An invited and entitled person who has accepted the current terms reaches the
  builder
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:39.964535+00:00'
updated_at: '2026-11-01T09:54:02.039761+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

An invited person holding an active, current grant, presenting a valid proven
identity, who has accepted the current terms, reaches the builder: the request
succeeds and returns the builder application page rather than a refusal. The
admission check lets the right person through as well as refusing the wrong one;
terms acceptance is the next check after it, so this outcome requires both.

## Verification

Invite an address and record its acceptance of the current terms, then request
the builder as that address with a valid proven identity. Assert the response
succeeds, is an HTML document, and is the builder application rather than the
refusal message or the terms page.
