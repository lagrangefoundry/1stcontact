---
uid: acceptance_criterion-5479af22
id: AC-1732
type: acceptance_criterion
title: A handover that did not fully succeed reports what went wrong rather than reading
  as added
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:32:43.291623+00:00'
updated_at: '2026-09-11T05:42:21.585881+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

A handover that did not fully succeed says so rather than reading as though it had. When a
handover is begun in the conversation, the turn it produces reports the actual outcome:

- A file that could not be handed over at all says it did not upload, and carries the reason the
  platform gave (for example, that the file exceeded the size limit) rather than a generic
  failure.
- A file that was stored but could not be put on the site says the file arrived and names the
  reason the placement did not land.
- A file that was stored but is not yet searchable says so — stored, but not findable yet.

A failed or partial handover is never reported as simply "added".

## Verification

Drive a conversational handover against a platform that refuses the upload with a stated reason,
and assert the resulting turn says the file did not upload and contains that reason. Repeat with a
platform that stores the file but reports a failed site placement, and with one that stores it but
reports it unindexed, asserting each turn names that outcome and does not read as an unqualified
success.