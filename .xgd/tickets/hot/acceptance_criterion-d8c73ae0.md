---
uid: acceptance_criterion-d8c73ae0
id: AC-1808
type: acceptance_criterion
title: Arrivals are the client's knowledge alone, and no client knowledge opened is
  an ordinary state that still takes turns
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:29:00.582322+00:00'
updated_at: '2026-09-14T06:52:06.474163+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

Arrival notices are about the **client's own knowledge** and nothing else. The
knowledge that ships with the software is a release artefact — identical for
every client and changed only by upgrading — so it cannot acquire a document
during a conversation and is never swept for arrivals.

A conversation opened with no client knowledge available at all is an ordinary
state, not a failure: its turns run and stream normally and simply carry no
arrival notice. Whichever knowledge bases did open are the ones the conversation
is primed with and granted; it is never told it can search a corpus that would
answer nothing.

## Verification

Take turns on a conversation for which only the shipped knowledge opened, and
confirm the turns complete, the priming and the grant name that knowledge base
alone, and no arrival notice ever appears however the shipped corpus is
manipulated. Confirm the converse: with the client's knowledge open, arrivals to
it are announced as usual.