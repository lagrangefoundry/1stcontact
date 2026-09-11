---
uid: acceptance_criterion-4c1d0046
id: AC-1760
type: acceptance_criterion
title: An invited and entitled person reaches the builder
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:39.964535+00:00'
updated_at: '2026-09-11T06:29:39.964535+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

An invited person holding an active, current grant, presenting a valid proven
identity, reaches the builder: the request succeeds and returns the builder
application page rather than a refusal. The second check admits the right person
as well as refusing the wrong one.

## Verification

Invite an address, then request the builder as that address with a valid proven
identity. Assert the response succeeds, is an HTML document, and is the builder
application rather than the refusal message.
