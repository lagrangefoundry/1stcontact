---
uid: acceptance_criterion-971f366f
id: AC-1804
type: acceptance_criterion
title: A conversation's coverage starts where the map's ends, so a document arriving
  in the gap is announced on the first turn
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:44.375820+00:00'
updated_at: '2026-09-14T06:52:07.028008+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

A conversation's coverage of the client's knowledge begins exactly where the
map's coverage ends: a document that arrived **after** the client's map was last
built but **before** the conversation was opened is announced on that
conversation's first turn.

The map and the notice are therefore complementary rather than overlapping —
neither a document that the map already describes is re-announced as new, nor is
a document that arrived in the gap left invisible. Where no map has been built at
all, coverage begins when the conversation does, which is the same rule read at
its other end: a description that covers nothing ends where the conversation
starts.

## Verification

Build a client map, then upload a document, then open a fresh conversation and
take its first turn: confirm the notice names the document uploaded after the
build. Then confirm the complementary half — a document that the map was built
after, and therefore already describes, is not announced as an arrival on that
first turn. Finally, with no map ever built, open a conversation, take a turn,
upload a document, and confirm it is announced on the next turn and not before.