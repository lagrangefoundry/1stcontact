---
uid: acceptance_criterion-a4905fba
id: AC-1404
type: acceptance_criterion
title: A whole turn runs on the deployed host with the model key read from a deploy
  secret, and its edits land in the shared store
created_by: xgd
created_at: '2026-08-31T10:37:44.631322+00:00'
updated_at: '2026-08-31T10:59:27.633746+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

A whole turn runs on the deployed host — not only on the operator's machine. The
model credential is read from the deployment's own secret rather than from any
process environment, the turn streams its activity and the assistant's words and
ends in exactly one completion, and the change it makes is present afterwards in
the shared store the site lives in, readable by anything else that reads that
store.

A deployment carrying no model credential is not a boot failure and must not
present as one: opening the conversation still succeeds, still replays the stored
turns, and still reports that a turn cannot be run and why. A missing credential
costs a turn, never the conversation.

## Verification

Against the deployed host, with the model credential supplied only as the
deployment's secret, open a conversation for a site and run a turn that changes
it. Observe the stream carrying an activity event, the assistant's text and one
completion; then read that site's draft back out of the shared store and find the
change. Repeat the open with the credential absent from the deployment: the open
still answers with a conversation identifier and the site's stored turns, and
reports it is not ready.