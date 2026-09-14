---
uid: acceptance_criterion-ac988ebb
id: AC-1818
type: acceptance_criterion
title: The change signal is the host's own, not an operation the assistant may call,
  skip or fake
created_by: martin-github@westhead.me
created_at: '2026-09-14T07:52:48.156592+00:00'
updated_at: '2026-09-14T07:52:48.156592+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

The change signal is the host's own, derived from the site's draft change count, and is
not something the assistant can call: no operation the conversation offers it announces a
change, refreshes anything, or reloads anything.

Two consequences follow, and both are observable. A write is announced whether or not the
assistant thinks to mention it — an assistant that edits the site and then says nothing
about having done so still produces the signal. And an assistant that says it changed
something while its operations wrote nothing produces none, because the signal follows the
draft's count rather than the conversation.

## Verification

Enumerate the operations offered in an open conversation and confirm that none of them
announces a change, refreshes a view, or reloads anything.

Drive a turn whose operations write while the assistant's reply says nothing about a
change, and confirm the signal is carried anyway. Drive a turn whose reply claims a change
while its operations write nothing, and confirm no signal is carried.
