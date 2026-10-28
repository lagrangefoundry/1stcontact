---
uid: acceptance_criterion-230228e8
id: AC-2055
type: acceptance_criterion
title: A new session is recorded in its archive header and reported by the roles endpoint
  under the consultant name alone; the grant and the corpus purpose are the consultant's
created_by: xgd
created_at: '2026-10-28T04:10:01.934755+00:00'
updated_at: '2026-10-28T04:10:01.934755+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
A conversation opened after the rename records its role as `consultant` in the
durable header of its stored transcript, and the capability answer lists
`consultant` as its only role — the former name is a read path, never something
the host writes or claims to be. The operations grant is keyed by the consultant
role alone, so a session under that name constructs its granted surface. The
purpose that primes knowledge retrieval describes advising and building with a
non-technical client; it does not name the former role and does not describe
the role as one that "looks after" a site.

## Verification
Run one turn on a fresh origin, then parse the session header of the stored
transcript: its role is `consultant`. Fetch the roles endpoint: its role list is
exactly `["consultant"]`. The published grant declaration's role keys are
exactly `["consultant"]`. The role purpose text matches "advise" and matches
neither the former role name nor "look after".
