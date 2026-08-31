---
uid: acceptance_criterion-81aea86c
id: AC-1452
type: acceptance_criterion
title: A bounce to the sign-in page reads as an authentication refusal, never as success
created_by: xgd
created_at: '2026-08-31T17:03:15.160272+00:00'
updated_at: '2026-08-31T17:03:15.160272+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

A push that the gate bounces to a sign-in page is reported as an
**authentication refusal**, naming the credential to set and the command that
provisions it.

- The redirect is not followed. Followed, the bounce returns a sign-in document
  with a success status: the refusal branch never runs and the operator meets a
  parse error about a document type instead of "you are not authenticated".
- A redirect status is treated as a refusal, not as a success and not as a
  transport failure — it is the gate declining, in a redirect's clothing.
- An **opaque** response, which is what an unfollowed redirect reads as under a
  client that returns one, is reported identically: the two shapes of "bounced
  to a sign-in page" must not read differently, and neither may read as success.
- Both refusals name the same fix as the missing-credential refusal, so the
  operator reaches the provisioning command from either direction.
- The ordinary refusal statuses for an unauthorised caller are reported with the
  same guidance; a refusal for any other reason reports the status and body it
  received without inventing a credential problem.

## Verification

Drive a push against a stub answering with a redirect status and observe it
fails, that the failure names the bounce to a sign-in page and names both
credential halves and the provisioning command, and that the request was made
without following redirects.

Drive the same push against a stub answering with an opaque response — no
status, no body — and observe the same substance rather than a bare "refused
with 0".

## Reconciliation note

The opaque-response case is not named in the intent ticket, which describes the
redirect only. It is asserted here because the two shapes are the same event
observed through two conforming clients, and a criterion that covered one would
let the other regress into an unreadable failure. Decided at reconciliation,
2026-08-31.
