---
uid: acceptance_criterion-a0c627a1
id: AC-1795
type: acceptance_criterion
title: A cold conversation is primed, on every host, with the consultant system prompt,
  then both maps in one landscape section (the client's first), then purpose, then
  how to search
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:08.832526+00:00'
updated_at: '2026-11-08T02:33:13.327916+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

On every host that runs the consultant (the Node CLI and the deployed Worker), a
conversation opened cold is primed in this order:

1. the consultant system prompt;
2. **one** description of what exists, carrying both bodies of knowledge inside
   it — the client's own map and the map of this system, in that order;
3. what this assistant is for (its purpose);
4. how to search and what it may do (the mechanism, carrying this session's
   manual), which is the last section of the priming.

Both knowledge bases are named in the priming as searchable, so what the
conversation is told exists matches what it has actually been granted. There is
no second landscape section, and neither map is presented as a separate kind of
thing the assistant must choose between before it can look.

The priming carries no "your purpose" heading and no closing instruction telling
the assistant to prime itself. The purpose is recognisable by its own text, and
nothing in the priming begins after the mechanism.

## Verification

Open a conversation for a site whose client corpus has a published map, take a
turn, and inspect the system prompt the model was actually sent for that turn
(with any cache-split text blocks joined back into the one string the model
reads):

- the consultant system prompt appears before the landscape section;
- a landscape section exists, and both the client's map content and the system
  map content appear inside it, the client's before the system's;
- the purpose text appears after both maps and before the search/mechanism
  section;
- no section of the priming begins after the search/mechanism section;
- both knowledge base names appear in the priming.
