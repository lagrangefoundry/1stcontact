---
uid: acceptance_criterion-3e2eaa0f
id: AC-1745
type: acceptance_criterion
title: Admission refuses when the platform tenant is unconfigured, naming what is
  missing
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:41.756606+00:00'
updated_at: '2026-11-01T18:26:52.123584+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

When the 1st Contact business's tenant setting is not configured, admission
refuses rather than guessing a default. The refusal is a configuration error that
names the missing setting and where it has to be set, and it is made before
anything is looked up or written — no arrival stamp is recorded. The invite does
not carry this refusal: it is scoped by the caller's business and needs no
platform tenant of its own.

## Verification

With a person on record, attempt admission for their address with the platform
tenant setting empty. Assert it fails with a configuration error naming the
missing setting and where to set it, and that the person's first- and
last-arrival stamps are unchanged.
