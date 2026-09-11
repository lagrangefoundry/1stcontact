---
uid: acceptance_criterion-a8dc03a6
id: AC-1755
type: acceptance_criterion
title: An identity carrying no email address is refused rather than failing
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:20.492007+00:00'
updated_at: '2026-09-11T06:37:28.109414+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

An identity that carries no email address — an automated caller authenticating as
a machine name rather than a person — has nothing to bind to and is refused. It
is a refusal reporting "no address", not a failure: automation reaching this
surface is a configuration mistake rather than an attack.

## Verification

Attempt admission with no address present. Assert the attempt is refused, that
the reported reason names the absent address, and that nothing was raised or
created.