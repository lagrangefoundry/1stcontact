---
uid: acceptance_criterion-a0c627a1
id: AC-1795
type: acceptance_criterion
title: A cold conversation is primed with both maps in one landscape section, the
  client's first, then purpose, then how to search
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:08.832526+00:00'
updated_at: '2026-09-14T06:28:08.832526+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

A conversation opened cold is primed with **one** description of what exists,
carrying both bodies of knowledge inside it: the client's own map and the map of
this system, in that order. That single section comes first, followed by what
this assistant is for, followed by how to search and what it may do, followed by
the instruction to begin. Both knowledge bases are named in the priming as
searchable, so what the conversation is told exists matches what it has actually
been granted.

There is no second landscape section, and neither map is presented as a separate
kind of thing the assistant must choose between before it can look.

## Verification

Open a conversation for a site whose client corpus has a published map, and take
a turn. Inspect the context the assistant was given for that turn:

- a landscape section exists, and both the client's map content and the system
  map content appear inside it — after the landscape heading and before the
  purpose section;
- the client's map content appears before the system's;
- the purpose section precedes the search/mechanism section, which precedes the
  closing instruction to begin;
- both knowledge base names appear in the priming.
