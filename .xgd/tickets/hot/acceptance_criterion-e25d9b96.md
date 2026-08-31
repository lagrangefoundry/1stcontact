---
uid: acceptance_criterion-e25d9b96
id: AC-1408
type: acceptance_criterion
title: No credential the host holds appears in a log, an error envelope or a client
  response, including inside a failing turn's stream
created_by: xgd
created_at: '2026-08-31T10:38:37.376752+00:00'
updated_at: '2026-08-31T10:59:27.139159+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

No credential the host holds appears in anything it says: not in a log line, not
in an error the caller receives, not in the text delivered inside a failing turn's
stream. This holds on the paths a credential is most likely to arrive on — an
error thrown from below that carries the request it tried to send — and not only
on the paths written with a credential in mind.

Where a value is removed, what is left says so plainly, and the rest of the
message survives: a diagnostic scrubbed into uselessness is its own failure,
because the operator still has to find out what went wrong.

## Verification

Configure the host with a known credential, including one containing characters
that would be special to a pattern matcher. Drive the two paths on which a raw
failure becomes text a caller reads — a failure before a turn starts, and a
failure once a turn is already streaming — with an underlying error that embeds
the credential verbatim. Assert the credential appears nowhere in the response
bytes, that a visible marker stands where it was, and that the surrounding
explanation is still readable. Assert prose that merely resembles a credential is
left untouched.