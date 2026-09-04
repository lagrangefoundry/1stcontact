---
uid: acceptance_criterion-2e8d8ffd
id: AC-1530
type: acceptance_criterion
title: Conversation growth moves the index only; the published landscape is untouched
  by talking
created_by: xgd
created_at: '2026-09-04T03:36:36.076296+00:00'
updated_at: '2026-09-04T03:46:51.325240+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0fb17a68
  kind: behavior
  regression_only: false
---

## Criterion

Conversation growth moves only the index, never the landscape. However far a conversation grows and
however many times that growth causes it to be indexed, the landscape published for that client is
neither created nor rebuilt as a result: a client whose only activity is talking has no landscape
published by that talking, and a client who already had one still has exactly the landscape that was
published before, unchanged in content.

This holds regardless of whether the host has any way to describe territories at all — indexing a
conversation must not be able to fail, or become expensive, because of the landscape.

## Verification

With a client's knowledge that has no published landscape, grow a conversation past the indexing
threshold several times over, confirming each time that the conversation was indexed and is
searchable, and observe that no landscape has been published. Repeat against a client with a
landscape already published and observe the published landscape's content is byte-for-byte what it
was before. Perform both with no description capability supplied to the host and observe the
conversation indexing still succeeds.