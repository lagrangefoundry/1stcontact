---
uid: acceptance_criterion-ae33f0ab
id: AC-1033
type: acceptance_criterion
title: A definition changed outside the workspace is shown on the next request, with
  no render step and no restart — and unwinds the same way
created_by: xgd
created_at: '2026-08-10T07:29:13.015523+00:00'
updated_at: '2026-08-10T07:29:13.015523+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

A change to a site's definition made anywhere at all — from the command line, or
by editing the stored definition directly — is visible in both draft-side
channels on the next request. Nothing must be re-rendered first, nothing must be
restarted, and nothing on screen has to be told the change happened. Reverting
the definition reverts what is served, on the next request, the same way.

This closes the staleness class that serving stored renderings carried: a change
made outside the workspace's own save path used to be invisible until someone
re-rendered, and a stale page looks exactly like a working one, just older.

## Verification

Request a draft-side channel and record what comes back. Change the site's
definition outside the workspace — write a distinctive value into the stored
definition directly — and, with no other action, request both draft-side channels
again and assert the new value is present in each. Restore the definition and
request once more, asserting the value is gone: what is served must follow the
definition in both directions, so the assertion cannot pass on a rendering that
was simply produced once and held.